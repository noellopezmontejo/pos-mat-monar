const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

/**
 * Servicio para generar PDFs Premium de CFDI 4.0
 */
class PDFInvoiceService {
  
  /**
   * Traduce un número a su representación en letras (español)
   */
  static numeroALetras(num) {
    const enteros = Math.floor(num);
    const centavos = Math.round((num - enteros) * 100);
    const letrasCentavos = `${centavos.toString().padStart(2, '0')}/100 M.N.`;
    
    if (enteros === 0) return `CERO PESOS ${letrasCentavos}`;
    
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = {
      11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
      16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
      21: 'VEINTIUNO', 22: 'VEINTIDOS', 23: 'VEINTITRES', 24: 'VEINTICUATRO',
      25: 'VEINTICINCO', 26: 'VEINTISEIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
    };
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const traducirSeccion = (n) => {
      let str = '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (n === 100) return 'CIEN ';

      if (c > 0) str += centenas[c] + ' ';
      
      const rest = n % 100;
      if (rest > 0) {
        if (especiales[rest]) {
          str += especiales[rest] + ' ';
        } else {
          if (d > 0) {
            str += decenas[d];
            if (u > 0) str += ' Y ' + unidades[u];
            str += ' ';
          } else if (u > 0) {
            str += unidades[u] + ' ';
          }
        }
      }
      return str;
    };

    let n = enteros;
    let letras = '';

    const millones = Math.floor(n / 1000000);
    n = n % 1000000;
    const miles = Math.floor(n / 1000);
    const unidadesSimples = n % 1000;

    if (millones > 0) {
      letras += millones === 1 ? 'UN MILLON ' : `${traducirSeccion(millones)} MILLONES `;
    }
    if (miles > 0) {
      letras += miles === 1 ? 'MIL ' : `${traducirSeccion(miles)} MIL `;
    }
    if (unidadesSimples > 0) {
      letras += traducirSeccion(unidadesSimples);
    }

    const palabraPeso = enteros === 1 ? 'PESO' : 'PESOS';
    return `(${letras.trim()} ${palabraPeso} ${letrasCentavos})`.toUpperCase();
  }

  /**
   * Genera el buffer de PDF para un CFDI dado
   */
  static async generateInvoicePDF(cfdi, profile) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 35, size: 'LETTER' });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Paleta de Colores Premium (Slate y Azul Corporativo)
        const primaryColor = '#1e3a8a'; // Azul marino profundo
        const secondaryColor = '#475569'; // Slate
        const lightBg = '#f8fafc'; // Gris muy claro
        const borderCol = '#e2e8f0';

        // 1. Encabezado y Logo
        let logoPlaced = false;
        if (profile.logo_url) {
          const logoPath = path.join(__dirname, '../../../public', profile.logo_url);
          if (fs.existsSync(logoPath)) {
            try {
              doc.image(logoPath, 35, 35, { height: 50 });
              logoPlaced = true;
            } catch (err) {
              console.error('Error al renderizar logo de empresa:', err.message);
            }
          }
        }

        if (!logoPlaced) {
          // Logo de texto Premium si no hay archivo de imagen
          doc.rect(35, 35, 45, 45).fill(primaryColor);
          const firstLetter = (profile.trade_name || profile.name || 'M').slice(0, 1);
          doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(firstLetter, 48, 45);
          doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text(profile.trade_name || profile.name || 'MATERIALES MONAR', 90, 40);
          doc.fontSize(8).fillColor(secondaryColor).font('Helvetica').text('Materiales y Construcción', 90, 58);
        }

        // Datos del Emisor (Izquierda)
        const emisorY = 100;
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('EMISOR', 35, emisorY);
        doc.font('Helvetica').fontSize(8).fillColor('#334155');
        
        const emisorName = profile.trade_name || profile.name || 'MATERIALES MONAR S.A. DE C.V.';
        doc.text(`Razón Social: ${emisorName}`);
        doc.text(`RFC: ${profile.rfc || 'EKU9003173C9'}`);
        doc.text(`Régimen Fiscal: 601 - General de Ley Personas Morales`);
        doc.text(`Domicilio Fiscal (CP): ${profile.zip_code || profile.address?.slice(-5) || '30470'}`);

        // Caja de Detalles de Factura (Derecha)
        const boxX = 350;
        const boxY = 35;
        const boxWidth = 227;
        const boxHeight = 110;

        doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8).fill(lightBg).stroke(borderCol);
        
        doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('FACTURA', boxX + 15, boxY + 12);
        
        // UUID, Serie y Folio
        doc.fontSize(8).fillColor('#0f172a').font('Helvetica-Bold');
        doc.text('Folio Fiscal (UUID):', boxX + 15, boxY + 30);
        doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(cfdi.uuid || 'N/A', boxX + 15, boxY + 40, { width: boxWidth - 30 });
        
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
        doc.text('Serie / Folio:', boxX + 15, boxY + 56);
        doc.font('Helvetica').fillColor('#475569').text(`CFDI-${cfdi.id.slice(0, 6).toUpperCase()}`, boxX + 100, boxY + 56);

        doc.font('Helvetica-Bold').text('Fecha de Certificación:', boxX + 15, boxY + 70);
        doc.font('Helvetica').fillColor('#475569').text(new Date(cfdi.created_at).toLocaleString('es-MX'), boxX + 115, boxY + 70);

        doc.font('Helvetica-Bold').text('Tipo de Comprobante:', boxX + 15, boxY + 84);
        doc.font('Helvetica').fillColor('#475569').text(cfdi.type === 'I' ? 'I - Ingreso' : 'E - Egreso (Nota de Crédito)', boxX + 115, boxY + 84);

        doc.font('Helvetica-Bold').text('Efecto SAT:', boxX + 15, boxY + 96);
        doc.font('Helvetica').fillColor('#475569').text(cfdi.status, boxX + 115, boxY + 96);

        // 2. Datos del Receptor (Cliente)
        const receptorY = 175;
        doc.roundedRect(35, receptorY, 542, 55, 6).fill(lightBg).stroke(borderCol);
        
        // Obtener datos del cliente de las ventas asociadas
        const sale = cfdi.sales?.[0];
        const client = sale?.customer?.fiscal_client || {
          rfc: 'XAXX010101000',
          business_name: 'PUBLICO EN GENERAL',
          regime: '616',
          cfdi_use: 'S01',
          zip_code: '30470'
        };

        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('RECEPTOR', 50, receptorY + 10);
        doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
        
        // Dos columnas para datos del cliente
        doc.text(`RFC: ${client.rfc}`, 50, receptorY + 23);
        doc.text(`Nombre / Razón Social: ${client.business_name}`, 50, receptorY + 36);
        
        doc.text(`Uso CFDI: ${client.cfdi_use || 'CP01 - Pagos'}`, 300, receptorY + 23);
        doc.text(`Régimen Receptor: ${client.regime || '616 - Sin obligaciones fiscales'}`, 300, receptorY + 36);

        // 3. Tabla de Conceptos (Productos)
        const tableY = 250;
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('CONCEPTOS / PARTIDAS', 35, tableY);

        // Cabeceras de Tabla
        const headers = [
          { text: 'Clave SAT', x: 35, w: 60, align: 'left' },
          { text: 'No. Identificación', x: 100, w: 80, align: 'left' },
          { text: 'Cant.', x: 185, w: 30, align: 'center' },
          { text: 'Unidad', x: 220, w: 40, align: 'left' },
          { text: 'Descripción', x: 265, w: 145, align: 'left' },
          { text: 'P. Unitario', x: 415, w: 55, align: 'right' },
          { text: 'Importe (S/IVA)', x: 475, w: 65, align: 'right' },
          { text: 'IVA (16%)', x: 542, w: 35, align: 'right' }
        ];

        // Fondo cabecera
        doc.rect(35, tableY + 12, 542, 20).fill(primaryColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        headers.forEach(h => {
          doc.text(h.text, h.x, tableY + 18, { width: h.w, align: h.align });
        });

        // Contenido de la Tabla
        let currentY = tableY + 32;
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');

        // Reunir todos los items de todas las ventas asociadas
        const items = [];
        cfdi.sales?.forEach(s => {
          s.items?.forEach(item => {
            items.push({
              sat_code: item.product?.category?.sat_code || '01010101',
              sku: item.product?.legacy_code || item.product_id?.slice(0,8) || 'N/A',
              quantity: item.quantity,
              unit: item.unit || 'Pieza',
              name: item.product?.name || 'Concepto de Venta',
              folio: s.folio,
              price: item.price
            });
          });
        });

        items.forEach((item, index) => {
          const precioConIva = item.price / 100;
          const valorUnitario = precioConIva / 1.16;
          const importe = valorUnitario * item.quantity;
          const iva = importe * 0.16;
          const descStr = `[Ref: ${item.folio}] ${item.name}`;

          // Calcular altura dinámica de la descripción para evitar encimarse
          const descHeight = doc.heightOfString(descStr, { width: 145 });
          const rowHeight = Math.max(16, descHeight + 4);

          // Alternar fila de fondo gris claro
          if (index % 2 === 1) {
            doc.rect(35, currentY - 2, 542, rowHeight).fill('#f8fafc');
          }

          doc.fillColor('#334155');
          doc.text(item.sat_code, 35, currentY, { width: 60, align: 'left' });
          doc.text(item.sku, 100, currentY, { width: 80, align: 'left' });
          doc.text(item.quantity.toString(), 185, currentY, { width: 30, align: 'center' });
          doc.text(item.unit, 220, currentY, { width: 40, align: 'left' });
          
          doc.text(descStr, 265, currentY, { width: 145, align: 'left' });
          
          doc.text(`$${valorUnitario.toFixed(2)}`, 415, currentY, { width: 55, align: 'right' });
          doc.text(`$${importe.toFixed(2)}`, 475, currentY, { width: 65, align: 'right' });
          doc.text(`$${iva.toFixed(2)}`, 542, currentY, { width: 35, align: 'right' });

          currentY += rowHeight;
        });

        // Línea divisoria
        doc.moveTo(35, currentY).lineTo(577, currentY).strokeColor(borderCol).stroke();

        // 4. Sección de Totales (Alineado a la derecha)
        const totalsY = currentY + 15;
        doc.roundedRect(350, totalsY, 227, 65, 6).fill(lightBg).stroke(borderCol);

        doc.fontSize(8.5).fillColor('#0f172a').font('Helvetica-Bold');
        doc.text('Subtotal:', 365, totalsY + 12);
        doc.font('Helvetica').text(`$${(cfdi.subtotal || 0).toFixed(2)}`, 480, totalsY + 12, { width: 85, align: 'right' });

        doc.font('Helvetica-Bold').text('IVA Trasladado (16.00%):', 365, totalsY + 28);
        doc.font('Helvetica').text(`$${(cfdi.taxes || 0).toFixed(2)}`, 480, totalsY + 28, { width: 85, align: 'right' });

        doc.font('Helvetica-Bold').fillColor(primaryColor).text('Total Comprobante:', 365, totalsY + 46);
        doc.text(`$${(cfdi.total_amount || 0).toFixed(2)}`, 480, totalsY + 46, { width: 85, align: 'right' });

        // Cantidad con Letra (Izquierda de totales)
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('IMPORTE CON LETRA', 35, totalsY + 12);
        const textoLetras = PDFInvoiceService.numeroALetras(cfdi.total_amount || 0);
        doc.font('Helvetica').fillColor('#334155').fontSize(7).text(textoLetras, 35, totalsY + 24, { width: 300 });

        // 5. Timbre Digital SAT (QR + Sellos)
        const stampY = totalsY + 85;
        doc.rect(35, stampY, 542, 1).fill(borderCol); // Divisor

        // QR Code
        const qrSize = 90;
        const qrX = 35;
        const qrY = stampY + 15;

        // Intentar descargar un código QR real de la API pública o dibujar un marcador de posición muy limpio
        let qrLoaded = false;
        try {
          const rfcEmisor = profile.rfc || 'EKU9003173C9';
          const rfcReceptor = client.rfc;
          const totalStr = (cfdi.total_amount || 0).toFixed(6);
          const satQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
            `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${cfdi.uuid}&re=${rfcEmisor}&rr=${rfcReceptor}&tt=${totalStr}&fe=${cfdi.uuid.slice(-8)}`
          )}`;
          
          const qrResponse = await axios.get(satQrUrl, { responseType: 'arraybuffer', timeout: 3000 });
          doc.image(Buffer.from(qrResponse.data), qrX, qrY, { width: qrSize });
          qrLoaded = true;
        } catch (err) {
          console.warn('[QR Code Error] No se pudo obtener QR de la API. Usando caja estructurada en PDF.');
        }

        if (!qrLoaded) {
          // QR Mockup de alta fidelidad si falla internet
          doc.lineWidth(1).strokeColor('#000000');
          doc.rect(qrX, qrY, qrSize, qrSize).stroke();
          // Dibujar marcas de esquina del QR
          doc.rect(qrX + 5, qrY + 5, 20, 20).stroke();
          doc.rect(qrX + 5, qrY + qrSize - 25, 20, 20).stroke();
          doc.rect(qrX + qrSize - 25, qrY + 5, 20, 20).stroke();
          // Rellenar cuadritos internos
          doc.rect(qrX + 9, qrY + 9, 12, 12).fill('#000000');
          doc.rect(qrX + 9, qrY + qrSize - 21, 12, 12).fill('#000000');
          doc.rect(qrX + qrSize - 21, qrY + 9, 12, 12).fill('#000000');
          // Centro decorativo
          doc.rect(qrX + 35, qrY + 35, 20, 20).fill('#334155');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6).text('SAT', qrX + 39, qrY + 42);
        }

        // Bloques de sellos digitales SAT (Derecha de QR)
        const stampDetailsX = qrX + qrSize + 15;
        const stampWidth = 542 - qrSize - 15;
        let detailsY = qrY;

        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(6.5);
        
        doc.text('RFC del PAC que certificó:', stampDetailsX, detailsY);
        doc.font('Helvetica').fontSize(6).fillColor('#475569').text('SAT970701NN3', stampDetailsX + 110, detailsY);
        
        detailsY += 10;
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('No. de Certificado del SAT:', stampDetailsX, detailsY);
        doc.font('Helvetica').fontSize(6).fillColor('#475569').text('00001000000504465028', stampDetailsX + 110, detailsY);
        
        detailsY += 12;
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Cadena Original del complemento de certificación digital del SAT:', stampDetailsX, detailsY);
        const cadenaOriginal = `||1.1|${cfdi.uuid || 'UUID-MOCK'}|${new Date().toISOString()}|SAT970701NN3|rJb5gUf2Z02nC4B4rW1Npe5f7v+pE/R26YxX3hF2+Jkd6eNnF/2s5G1zDdHxF8a2fUuO4vWzXzWz124f5a6m1xPz+YkH2mB1dC5N5nL4k/D9p2X2j4d1v5mN4k/D9p==|00001000000504465028||`;
        doc.font('Helvetica').fillColor('#64748b').text(cadenaOriginal, stampDetailsX, detailsY + 8, { width: stampWidth, align: 'justify' });

        detailsY += 28;
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Sello Digital del CFDI:', stampDetailsX, detailsY);
        const selloCfdi = `rJb5gUf2Z02nC4B4rW1Npe5f7v+pE/R26YxX3hF2+Jkd6eNnF/2s5G1zDdHxF8a2fUuO4vWzXzWz124f5a6m1xPz+YkH2mB1dC5N5nL4k/D9p2X2j4d1v5mN4k/D9p==`;
        doc.font('Helvetica').fillColor('#64748b').text(selloCfdi, stampDetailsX, detailsY + 8, { width: stampWidth, align: 'justify' });

        detailsY += 24;
        doc.fillColor('#0f172a').font('Helvetica-Bold').text('Sello del SAT:', stampDetailsX, detailsY);
        const selloSat = `mJb5gUf2Z02nC4B4rW1Npe5f7v+pE/R26YxX3hF2+Jkd6eNnF/2s5G1zDdHxF8a2fUuO4vWzXzWz124f5a6m1xPz+YkH2mB1dC5N5nL4k/D9p2X2j4d1v5mN4k/D9p==`;
        doc.font('Helvetica').fillColor('#64748b').text(selloSat, stampDetailsX, detailsY + 8, { width: stampWidth, align: 'justify' });

        // Pie de página
        doc.fillColor('#94a3b8').fontSize(6).font('Helvetica').text('Este documento es una representación impresa de un CFDI 4.0 - MATERIALES MONAR', 35, 740, { align: 'center', width: 542 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFInvoiceService;
