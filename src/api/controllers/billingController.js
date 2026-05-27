const { prisma } = require('../db');
const CFDIService = require('../services/cfdiService');

/**
 * Facturación de Ventas (Individual o Consolidada)
 */
const generateInvoice = async (req, res) => {
  try {
    const { sale_ids, fiscal_client_id, payment_form, payment_method, is_global, global_info } = req.body;

    if (!sale_ids || !Array.isArray(sale_ids) || sale_ids.length === 0) {
      return res.status(400).json({ error: 'Se requieren uno o más IDs de venta.' });
    }

    // Buscar Ventas
    const sales = await prisma.sale.findMany({
      where: { id: { in: sale_ids } },
      include: { items: { include: { product: { include: { category: true } } } } }
    });

    if (sales.length === 0) return res.status(404).json({ error: 'Ventas no encontradas.' });

    // Verificar datos fiscales
    let fiscalClient;
    if (fiscal_client_id) {
       fiscalClient = await prisma.fiscalClient.findUnique({ where: { id: fiscal_client_id } });
    } else {
       // Público en General Default
       fiscalClient = {
         rfc: 'XAXX010101000',
         business_name: 'PUBLICO EN GENERAL',
         regime: '616',
         cfdi_use: 'S01',
         zip_code: '30470'
       };
    }

    if (!fiscalClient) return res.status(404).json({ error: 'Información fiscal no válida.' });

    // Configuración del Emisor (Traer del perfil de empresa real)
    const profile = await prisma.companyProfile.findFirst();
    const emisor = {
      rfc: profile?.rfc || 'EKU9003173C9',
      name: profile?.trade_name || profile?.name || 'NC INTEGRAX SA DE CV',
      regime: '601',
      zip_code: '30470'
    };

    // Generar el CFDI
    const result = await CFDIService.generateInvoice(sales, fiscalClient, emisor, {
       type: 'I',
       global_info: is_global ? global_info : null
    });

    if (result.success) {
      const cfdi = await prisma.cFDI.create({
        data: {
          uuid: result.uuid,
          type: 'I',
          status: 'TIMBRADO',
          xml_url: result.xml,
          pdf_url: result.pdf_url,
          total_amount: result.total,
          subtotal: result.subtotal,
          taxes: result.taxes,
          sales: {
            connect: sale_ids.map(id => ({ id }))
          }
        }
      });
      return res.json({ message: 'Factura generada con éxito', cfdi });
    } else {
      return res.status(400).json({ error: 'Error en timbrado', details: result.error });
    }
  } catch (error) {
    console.error('[Billing Error]', error);
    res.status(500).json({ error: 'Error interno al generar factura' });
  }
};

/**
 * Generar Nota de Crédito (Egreso)
 */
const generateCreditNote = async (req, res) => {
  try {
    const { cfdi_id, amount, reason } = req.body;

    const originalCfdi = await prisma.cFDI.findUnique({
      where: { id: cfdi_id },
      include: { sales: { include: { items: { include: { product: true } } } } }
    });

    if (!originalCfdi) return res.status(404).json({ error: 'Factura original no encontrada.' });

    // En un escenario real, crearíamos una "Venta de Devolución" ficticia o real
    // Aquí simplificamos usando la información de la factura original
    const dummySale = {
       folio: `NC-${originalCfdi.uuid.slice(0, 6)}`,
       items: [{
         price: amount * 100, // En centavos
         quantity: 1,
         product: { name: `Nota de Crédito por: ${reason}` }
       }]
    };

    const profile = await prisma.companyProfile.findFirst();
    const emisor = { rfc: profile?.rfc || 'EKU9003173C9', name: profile?.name, regime: '601' };
    
    // El receptor es el mismo de la factura original
    // (Simplificado para el demo)
    const receptor = { rfc: 'XAXX010101000', business_name: 'CLIENTE ORIGINAL', regime: '601' };

    const result = await CFDIService.generateInvoice(dummySale, receptor, emisor, {
      type: 'E',
      related_uuid: originalCfdi.uuid,
      relation_type: '01'
    });

    if (result.success) {
      const nc = await prisma.cFDI.create({
        data: {
          uuid: result.uuid,
          type: 'E',
          status: 'TIMBRADO',
          related_uuid: originalCfdi.uuid,
          relation_type: '01',
          total_amount: result.total,
          xml_url: result.xml,
          pdf_url: result.pdf_url
        }
      });
      return res.json({ message: 'Nota de crédito generada', cfdi: nc });
    }
    res.status(400).json({ error: 'Error al generar nota de crédito' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * Cancelación de Factura mediante Nota de Crédito (Egreso)
 */
const cancelInvoice = async (req, res) => {
  try {
    const { id, reason } = req.body; 

    const cfdi = await prisma.cFDI.findUnique({ 
      where: { id },
      include: { sales: { include: { items: { include: { product: true } } } } }
    });
    
    if (!cfdi) return res.status(404).json({ error: 'CFDI no encontrado.' });
    if (cfdi.type !== 'I') return res.status(400).json({ error: 'Solo se pueden cancelar (mediante NC) facturas de Ingreso.' });
    if (cfdi.status === 'CANCELADO') return res.status(400).json({ error: 'El CFDI ya está cancelado.' });

    console.log(`[FEL] Generando Nota de Crédito por cancelación del UUID: ${cfdi.uuid}`);

    // Crear una venta dummy basada en la original para la NC
    const dummySale = {
       folio: `NC-${cfdi.uuid.slice(0, 6)}`,
       items: [{
         price: cfdi.total_amount * 100, // En centavos
         quantity: 1,
         product: { name: `Devolución/Cancelación (Motivo: ${reason})` }
       }]
    };

    const profile = await prisma.companyProfile.findFirst();
    const emisor = { rfc: profile?.rfc || 'EKU9003173C9', name: profile?.name, regime: '601', zip_code: profile?.zip_code || '30470' };
    const receptor = { rfc: 'XAXX010101000', business_name: 'PÚBLICO EN GENERAL', regime: '616', cfdi_use: 'G02', zip_code: '30470' };

    const result = await CFDIService.generateInvoice(dummySale, receptor, emisor, {
      type: 'E',
      related_uuid: cfdi.uuid,
      relation_type: '02' // 02: Nota de débito de los documentos relacionados, o 01: Nota de crédito
    });

    if (result.success) {
      // Registrar la NC
      const nc = await prisma.cFDI.create({
        data: {
          uuid: result.uuid,
          type: 'E',
          status: 'TIMBRADO',
          related_uuid: cfdi.uuid,
          relation_type: '02',
          total_amount: result.total,
          subtotal: result.subtotal,
          taxes: result.taxes,
          xml_url: result.xml,
          pdf_url: result.pdf_url,
          cancellation_reason: reason
        }
      });
      
      // Actualizar el estado de la factura original para marcar que fue "cancelada" vía NC
      await prisma.cFDI.update({
        where: { id },
        data: {
          status: 'CANCELADO (NC)',
          canceled_at: new Date()
        }
      });

      return res.json({ message: 'Factura cancelada mediante Nota de Crédito', cfdi: nc });
    } else {
      return res.status(400).json({ error: 'Error al timbrar Nota de Crédito', details: result.error });
    }
  } catch (error) {
    console.error('[NC Error]', error);
    res.status(500).json({ error: 'Error al emitir Nota de Crédito' });
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.cFDI.findMany({
      include: { sales: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = { generateInvoice, generateCreditNote, cancelInvoice, getInvoices };
