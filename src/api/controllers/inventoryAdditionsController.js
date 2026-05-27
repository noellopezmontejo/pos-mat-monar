const { prisma } = require('../db')
const CFDIService = require('../services/cfdiService')

// Helper para redondear a 2 decimales
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

/**
 * ----------------------------------------------------
 * WAREHOUSE TRANSFERS (TRASPASOS ENTRE ALMACENES)
 * ----------------------------------------------------
 */

// Obtener todos los traspasos
const getTransfers = async (req, res) => {
  try {
    const transfers = await prisma.warehouseTransfer.findMany({
      include: {
        origin_branch: true,
        dest_branch: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(transfers)
  } catch (error) {
    console.error('Error getTransfers:', error)
    res.status(500).json({ error: 'Error al obtener traspasos' })
  }
}

// Crear un traspaso (Descuenta de origen de inmediato)
const createTransfer = async (req, res) => {
  const { origin_branch_id, dest_branch_id, notes, items } = req.body
  const user_id = req.user?.id || 'SYSTEM'
  const username = req.user?.username || 'SYSTEM'

  if (!origin_branch_id || !dest_branch_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Parámetros de traspaso incompletos' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generar Folio consecutivo
      const count = await tx.warehouseTransfer.count()
      const folio = `TR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

      // 2. Crear registro de Traspaso
      const transfer = await tx.warehouseTransfer.create({
        data: {
          folio,
          origin_branch_id,
          dest_branch_id,
          notes,
          created_by: username,
          status: 'EN_TRANSITO',
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      })

      // 3. Descontar stock de origen y registrar en Kardex (OUT)
      for (const item of items) {
        const sourceStock = await tx.stock.findUnique({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id: origin_branch_id } }
        })

        if (!sourceStock || sourceStock.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ID ${item.product_id} en el almacén de origen`)
        }

        const updatedStock = await tx.stock.update({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id: origin_branch_id } },
          data: { quantity: { decrement: item.quantity } }
        })

        await tx.kardex.create({
          data: {
            product_id: item.product_id,
            branch_id: origin_branch_id,
            type: 'OUT',
            reason: `Traspaso en tránsito (${folio})`,
            quantity: item.quantity,
            balance: updatedStock.quantity,
            user_id,
            reference: folio
          }
        })
      }

      return transfer
    })

    res.json(result)
  } catch (error) {
    console.error('Error createTransfer:', error)
    res.status(500).json({ error: error.message || 'Error al procesar el traspaso' })
  }
}

// Recibir un traspaso (Suma a destino)
const receiveTransfer = async (req, res) => {
  const { id } = req.params
  const user_id = req.user?.id || 'SYSTEM'
  const username = req.user?.username || 'SYSTEM'

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener traspaso
      const transfer = await tx.warehouseTransfer.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!transfer) {
        throw new Error('Traspaso no encontrado')
      }

      if (transfer.status !== 'EN_TRANSITO') {
        throw new Error('El traspaso ya ha sido recibido o cancelado')
      }

      // 2. Actualizar estado del traspaso
      const updatedTransfer = await tx.warehouseTransfer.update({
        where: { id },
        data: {
          status: 'RECIBIDO',
          received_by: username,
          received_at: new Date()
        }
      })

      // 3. Sumar stock a destino y registrar Kardex (IN)
      for (const item of transfer.items) {
        const destStock = await tx.stock.upsert({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id: transfer.dest_branch_id } },
          update: { quantity: { increment: item.quantity } },
          create: {
            product_id: item.product_id,
            branch_id: transfer.dest_branch_id,
            quantity: item.quantity
          }
        })

        await tx.kardex.create({
          data: {
            product_id: item.product_id,
            branch_id: transfer.dest_branch_id,
            type: 'IN',
            reason: `Recepción de traspaso (${transfer.folio})`,
            quantity: item.quantity,
            balance: destStock.quantity,
            user_id,
            reference: transfer.folio
          }
        })
      }

      return updatedTransfer
    })

    res.json(result)
  } catch (error) {
    console.error('Error receiveTransfer:', error)
    res.status(500).json({ error: error.message || 'Error al recibir el traspaso' })
  }
}


/**
 * ----------------------------------------------------
 * PRODUCT CONVERSIONS (CONVERSIONES DE PRODUCTOS)
 * ----------------------------------------------------
 */

const getConversions = async (req, res) => {
  try {
    const conversions = await prisma.productConversion.findMany({
      include: {
        branch: true,
        source_product: true,
        target_product: true
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(conversions)
  } catch (error) {
    console.error('Error getConversions:', error)
    res.status(500).json({ error: 'Error al obtener las conversiones' })
  }
}

// Convertir producto (Consume origen, Genera destino según factor de unidad)
const convertProduct = async (req, res) => {
  const { branch_id, source_product_id, target_product_id, source_quantity } = req.body
  const user_id = req.user?.id || 'SYSTEM'
  const username = req.user?.username || 'SYSTEM'

  if (!branch_id || !source_product_id || !target_product_id || !source_quantity) {
    return res.status(400).json({ error: 'Datos de conversión incompletos' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener productos y validar factor
      const sourceProduct = await tx.product.findUnique({ where: { id: source_product_id } })
      const targetProduct = await tx.product.findUnique({ where: { id: target_product_id } })

      if (!sourceProduct || !targetProduct) {
        throw new Error('Producto origen o destino no existe')
      }

      // Validar si el origen tiene stock suficiente en la sucursal
      const sourceStock = await tx.stock.findUnique({
        where: { product_id_branch_id: { product_id: source_product_id, branch_id } }
      })

      if (!sourceStock || sourceStock.quantity < source_quantity) {
        throw new Error(`Stock insuficiente en el almacén para el producto origen (${sourceProduct.name})`)
      }

      // El factor de conversión indica cuántas unidades destino se generan por cada unidad origen
      // Ejemplo: 1 Rollo (origen) -> 100 Metros (destino). unit_factor del origen = 100
      const conversionFactor = sourceProduct.unit_factor || 1
      const targetQuantity = Math.round(source_quantity * conversionFactor)

      // 2. Generar Folio consecutivo
      const count = await tx.productConversion.count()
      const folio = `CV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`

      // 3. Descontar origen
      const updatedSourceStock = await tx.stock.update({
        where: { product_id_branch_id: { product_id: source_product_id, branch_id } },
        data: { quantity: { decrement: source_quantity } }
      })

      await tx.kardex.create({
        data: {
          product_id: source_product_id,
          branch_id,
          type: 'OUT',
          reason: `Conversión: Consumo para generar ${targetProduct.name} (${folio})`,
          quantity: source_quantity,
          balance: updatedSourceStock.quantity,
          user_id,
          reference: folio
        }
      })

      // 4. Aumentar destino
      const updatedTargetStock = await tx.stock.upsert({
        where: { product_id_branch_id: { product_id: target_product_id, branch_id } },
        update: { quantity: { increment: targetQuantity } },
        create: {
          product_id: target_product_id,
          branch_id,
          quantity: targetQuantity
        }
      })

      await tx.kardex.create({
        data: {
          product_id: target_product_id,
          branch_id,
          type: 'IN',
          reason: `Conversión: Generado desde ${sourceProduct.name} (${folio})`,
          quantity: targetQuantity,
          balance: updatedTargetStock.quantity,
          user_id,
          reference: folio
        }
      })

      // 5. Registrar la conversión
      const conversion = await tx.productConversion.create({
        data: {
          folio,
          branch_id,
          source_product_id,
          target_product_id,
          source_quantity,
          target_quantity: targetQuantity,
          conversion_factor: conversionFactor,
          created_by: username
        }
      })

      return conversion
    })

    res.json(result)
  } catch (error) {
    console.error('Error convertProduct:', error)
    res.status(500).json({ error: error.message || 'Error al procesar la conversión de producto' })
  }
}


/**
 * ----------------------------------------------------
 * PRODUCT KITS (KITS DE PRODUCTOS)
 * ----------------------------------------------------
 */

const getKits = async (req, res) => {
  try {
    const kits = await prisma.product.findMany({
      where: { is_kit: true },
      include: {
        kit_components: {
          include: {
            component: true
          }
        }
      }
    })
    res.json(kits)
  } catch (error) {
    console.error('Error getKits:', error)
    res.status(500).json({ error: 'Error al obtener kits de productos' })
  }
}

// Crear un Kit de productos (Define la receta/componentes)
const createKitProduct = async (req, res) => {
  const { name, barcode, category_id, price_1, components } = req.body
  const user_id = req.user?.id || 'SYSTEM'

  if (!name || !category_id || !components || !Array.isArray(components) || components.length === 0) {
    return res.status(400).json({ error: 'El nombre, la categoría y los componentes del kit son obligatorios' })
  }

  try {
    const kit = await prisma.$transaction(async (tx) => {
      // 1. Crear el producto base marcado como kit
      const newProduct = await tx.product.create({
        data: {
          name,
          barcode,
          category_id,
          base_unit: 'UNI',
          sale_unit: 'UNI',
          purchase_unit: 'UNI',
          price_1: price_1 || 0,
          is_kit: true,
          status: 'Activo',
          created_by: user_id
        }
      })

      // 2. Registrar los componentes en KitComponent
      await tx.kitComponent.createMany({
        data: components.map(c => ({
          kit_product_id: newProduct.id,
          component_id: c.component_id,
          quantity: c.quantity
        }))
      })

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: { kit_components: { include: { component: true } } }
      })
    })

    res.json(kit)
  } catch (error) {
    console.error('Error createKitProduct:', error)
    res.status(500).json({ error: 'Error al crear el kit de productos' })
  }
}

// Pre-ensamblar Kits físicos (Deduce componentes y agrega stock de kit)
const assembleKit = async (req, res) => {
  const { kit_product_id, branch_id, quantity } = req.body
  const user_id = req.user?.id || 'SYSTEM'

  if (!kit_product_id || !branch_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'ID del kit, almacén y cantidad son obligatorios' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener kit y sus componentes
      const kit = await tx.product.findUnique({
        where: { id: kit_product_id, is_kit: true },
        include: { kit_components: true }
      })

      if (!kit) {
        throw new Error('Kit de productos no encontrado')
      }

      // 2. Validar que tengamos stock de todos los componentes
      for (const component of kit.kit_components) {
        const requiredQty = component.quantity * quantity
        const compStock = await tx.stock.findUnique({
          where: { product_id_branch_id: { product_id: component.component_id, branch_id } }
        })

        if (!compStock || compStock.quantity < requiredQty) {
          throw new Error(`Stock insuficiente para el componente ID ${component.component_id}. Se requieren ${requiredQty} unidades`)
        }
      }

      // 3. Descontar stock de componentes y registrar en Kardex
      for (const component of kit.kit_components) {
        const requiredQty = component.quantity * quantity
        const updatedCompStock = await tx.stock.update({
          where: { product_id_branch_id: { product_id: component.component_id, branch_id } },
          data: { quantity: { decrement: requiredQty } }
        })

        await tx.kardex.create({
          data: {
            product_id: component.component_id,
            branch_id,
            type: 'OUT',
            reason: `Ensamblaje del kit ${kit.name} (Cantidad: ${quantity})`,
            quantity: requiredQty,
            balance: updatedCompStock.quantity,
            user_id,
            reference: `ENSAMBLE-${kit.id}`
          }
        })
      }

      // 4. Agregar stock del kit terminado y registrar en Kardex
      const updatedKitStock = await tx.stock.upsert({
        where: { product_id_branch_id: { product_id: kit_product_id, branch_id } },
        update: { quantity: { increment: quantity } },
        create: {
          product_id: kit_product_id,
          branch_id,
          quantity: quantity
        }
      })

      await tx.kardex.create({
        data: {
          product_id: kit_product_id,
          branch_id,
          type: 'IN',
          reason: `Kit ensamblado físicamente`,
          quantity,
          balance: updatedKitStock.quantity,
          user_id,
          reference: `ENSAMBLE-${kit.id}`
        }
      })

      return updatedKitStock
    })

    res.json({ message: 'Kit ensamblado con éxito', stock: result })
  } catch (error) {
    console.error('Error assembleKit:', error)
    res.status(500).json({ error: error.message || 'Error al ensamblar el kit' })
  }
}

// Desensamblar Kits (Deduce kit y devuelve stock de componentes)
const disassembleKit = async (req, res) => {
  const { kit_product_id, branch_id, quantity } = req.body
  const user_id = req.user?.id || 'SYSTEM'

  if (!kit_product_id || !branch_id || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'ID del kit, almacén y cantidad son obligatorios' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener kit
      const kit = await tx.product.findUnique({
        where: { id: kit_product_id, is_kit: true },
        include: { kit_components: true }
      })

      if (!kit) {
        throw new Error('Kit de productos no encontrado')
      }

      // 2. Validar stock del kit
      const kitStock = await tx.stock.findUnique({
        where: { product_id_branch_id: { product_id: kit_product_id, branch_id } }
      })

      if (!kitStock || kitStock.quantity < quantity) {
        throw new Error('Stock insuficiente del kit para desensamblar')
      }

      // 3. Descontar stock del kit
      const updatedKitStock = await tx.stock.update({
        where: { product_id_branch_id: { product_id: kit_product_id, branch_id } },
        data: { quantity: { decrement: quantity } }
      })

      await tx.kardex.create({
        data: {
          product_id: kit_product_id,
          branch_id,
          type: 'OUT',
          reason: `Desensamblaje del kit ${kit.name}`,
          quantity,
          balance: updatedKitStock.quantity,
          user_id,
          reference: `DESENSAMBLE-${kit.id}`
        }
      })

      // 4. Sumar stock de componentes
      for (const component of kit.kit_components) {
        const returnQty = component.quantity * quantity
        const compStock = await tx.stock.upsert({
          where: { product_id_branch_id: { product_id: component.component_id, branch_id } },
          update: { quantity: { increment: returnQty } },
          create: {
            product_id: component.component_id,
            branch_id,
            quantity: returnQty
          }
        })

        await tx.kardex.create({
          data: {
            product_id: component.component_id,
            branch_id,
            type: 'IN',
            reason: `Componente devuelto por desensamblaje del kit ${kit.name}`,
            quantity: returnQty,
            balance: compStock.quantity,
            user_id,
            reference: `DESENSAMBLE-${kit.id}`
          }
        })
      }

      return updatedKitStock
    })

    res.json({ message: 'Kit desensamblado con éxito', stock: result })
  } catch (error) {
    console.error('Error disassembleKit:', error)
    res.status(500).json({ error: error.message || 'Error al desensamblar el kit' })
  }
}


/**
 * ----------------------------------------------------
 * SUPPLIER RETURNS (DEVOLUCIONES A PROVEEDORES)
 * ----------------------------------------------------
 */

const getSupplierReturns = async (req, res) => {
  try {
    const returns = await prisma.supplierReturn.findMany({
      include: {
        supplier: true,
        branch: true,
        items: { include: { product: true } }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(returns)
  } catch (error) {
    console.error('Error getSupplierReturns:', error)
    res.status(500).json({ error: 'Error al obtener devoluciones a proveedores' })
  }
}

// Crear devolución a proveedor
const createSupplierReturn = async (req, res) => {
  const { supplier_id, branch_id, notes, cfdi_egreso_uuid, cfdi_egreso_folio, items } = req.body
  const user_id = req.user?.id || 'SYSTEM'
  const username = req.user?.username || 'SYSTEM'

  if (!supplier_id || !branch_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Datos de devolución incompletos' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generar Folio consecutivo
      const count = await tx.supplierReturn.count()
      const folio = `DEV-PROV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

      // 2. Descontar stock e ingresar Kardex (OUT)
      for (const item of items) {
        const currentStock = await tx.stock.findUnique({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id } }
        })

        if (!currentStock || currentStock.quantity < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ID ${item.product_id} en esta sucursal`)
        }

        const updatedStock = await tx.stock.update({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id } },
          data: { quantity: { decrement: item.quantity } }
        })

        await tx.kardex.create({
          data: {
            product_id: item.product_id,
            branch_id,
            type: 'OUT',
            reason: `Devolución a proveedor (${folio})`,
            quantity: item.quantity,
            balance: updatedStock.quantity,
            user_id,
            reference: folio
          }
        })
      }

      // 3. Crear registro de Devolución
      const supplierReturn = await tx.supplierReturn.create({
        data: {
          folio,
          supplier_id,
          branch_id,
          notes,
          cfdi_egreso_uuid,
          cfdi_egreso_folio,
          created_by: username,
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              cost: item.cost || 0
            }))
          }
        },
        include: { items: true }
      })

      // 4. Crear Nota de Crédito en Cuentas por Pagar (SupplierCreditNote) para conciliar saldos
      const totalAmount = items.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0)
      if (totalAmount > 0) {
        await tx.supplierCreditNote.create({
          data: {
            supplier_id,
            amount: totalAmount,
            balance: totalAmount,
            reason: `Devolución de mercancía ${folio}. CFDI NC: ${cfdi_egreso_folio || 'N/A'}`,
            status: 'Disponible'
          }
        })
      }

      return supplierReturn
    })

    res.json(result)
  } catch (error) {
    console.error('Error createSupplierReturn:', error)
    res.status(500).json({ error: error.message || 'Error al crear la devolución a proveedor' })
  }
}


/**
 * ----------------------------------------------------
 * CUSTOMER RETURNS (DEVOLUCIONES DE CLIENTES Y CFDI DE EGRESO)
 * ----------------------------------------------------
 */

const getCustomerReturns = async (req, res) => {
  try {
    const returns = await prisma.customerReturn.findMany({
      include: {
        customer: true,
        branch: true,
        cfdi_egreso: true,
        items: { include: { product: true } }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(returns)
  } catch (error) {
    console.error('Error getCustomerReturns:', error)
    res.status(500).json({ error: 'Error al obtener devoluciones de clientes' })
  }
}

// Crear devolución de cliente y timbrar CFDI de Egreso (Nota de Crédito) si es requerido
const createCustomerReturn = async (req, res) => {
  const { customer_id, branch_id, sale_id, notes, issue_cfdi, items } = req.body
  const user_id = req.user?.id || 'SYSTEM'
  const username = req.user?.username || 'SYSTEM'

  if (!customer_id || !branch_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Datos de devolución de cliente incompletos' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generar Folio
      const count = await tx.customerReturn.count()
      const folio = `DEV-CLI-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

      // 2. Re-ingresar stock e ingresar Kardex (IN)
      for (const item of items) {
        const updatedStock = await tx.stock.upsert({
          where: { product_id_branch_id: { product_id: item.product_id, branch_id } },
          update: { quantity: { increment: item.quantity } },
          create: {
            product_id: item.product_id,
            branch_id,
            quantity: item.quantity
          }
        })

        await tx.kardex.create({
          data: {
            product_id: item.product_id,
            branch_id,
            type: 'IN',
            reason: `Devolución de cliente (${folio})`,
            quantity: item.quantity,
            balance: updatedStock.quantity,
            user_id,
            reference: folio
          }
        })
      }

      // 3. Crear registro de devolución
      const customerReturn = await tx.customerReturn.create({
        data: {
          folio,
          customer_id,
          branch_id,
          notes,
          created_by: username,
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price || 0
            }))
          }
        },
        include: { items: { include: { product: { include: { category: true } } } } }
      })

      // 4. TIMBRADO FISCAL (CFDI de Egreso / Nota de Crédito)
      // Validamos si la venta original existe y tiene factura timbrada para relacionarla
      let cfdiEgresoRecord = null

      if (issue_cfdi && sale_id) {
        // Buscar el CFDI de Ingreso timbrado de la venta original
        const originalCfdi = await tx.cFDI.findFirst({
          where: {
            sales: { some: { id: sale_id } },
            type: 'I',
            status: 'TIMBRADO'
          }
        })

        if (originalCfdi && originalCfdi.uuid) {
          // Obtener datos fiscales del cliente
          const fiscalClient = await tx.fiscalClient.findFirst({
            where: { customers: { some: { id: customer_id } } }
          })

          const clientConfig = fiscalClient || {
            rfc: 'XAXX010101000',
            business_name: 'PUBLICO EN GENERAL',
            regime: '616',
            cfdi_use: 'S01',
            zip_code: '30470'
          }

          const profile = await tx.companyProfile.findFirst()
          const emisor = {
            rfc: profile?.rfc || 'EKU9003173C9',
            name: profile?.name || 'NC INTEGRAX SA DE CV',
            regime: '601',
            zip_code: '30470'
          }

          // Crear objeto de venta simulado para el timbrado con los productos de devolución
          const totalDevolucion = items.reduce((sum, i) => sum + ((i.price || 0) * i.quantity), 0)
          const dummySale = {
            folio: customerReturn.folio,
            items: customerReturn.items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price * 100, // CFDIService lo espera en centavos
              unit: item.product.sale_unit || 'Pieza',
              product: item.product
            }))
          }

          // Llamada de timbrado con PAC FEL, asignando Tipo de Relación 01 (Nota de Crédito)
          const stampResult = await CFDIService.generateInvoice(dummySale, clientConfig, emisor, {
            type: 'E', // Egreso
            related_uuid: originalCfdi.uuid,
            relation_type: '01' // Nota de crédito de los documentos relacionados
          })

          if (stampResult.success) {
            cfdiEgresoRecord = await tx.cFDI.create({
              data: {
                uuid: stampResult.uuid,
                type: 'E',
                status: 'TIMBRADO',
                xml_url: stampResult.xml,
                pdf_url: stampResult.pdf_url,
                total_amount: stampResult.total,
                subtotal: stampResult.subtotal,
                taxes: stampResult.taxes,
                related_uuid: originalCfdi.uuid,
                relation_type: '01'
              }
            })

            // Actualizar la devolución del cliente con el ID del CFDI de Egreso
            await tx.customerReturn.update({
              where: { id: customerReturn.id },
              data: { cfdi_egreso_id: cfdiEgresoRecord.id }
            })
          } else {
            console.error('[Return Timbrado Error]:', stampResult.error)
            // Lógica no bloqueante: la devolución física se guarda pero se registra que falló el timbrado
          }
        }
      }

      return {
        ...customerReturn,
        cfdi_egreso: cfdiEgresoRecord
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Error createCustomerReturn:', error)
    res.status(500).json({ error: error.message || 'Error al procesar la devolución de cliente' })
  }
}

module.exports = {
  getTransfers,
  createTransfer,
  receiveTransfer,
  getConversions,
  convertProduct,
  getKits,
  createKitProduct,
  assembleKit,
  disassembleKit,
  getSupplierReturns,
  createSupplierReturn,
  getCustomerReturns,
  createCustomerReturn
}
