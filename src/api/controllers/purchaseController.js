const { prisma } = require('../db')
const { updateStock } = require('../utils/stockService')

const getPurchaseOrders = async (req, res) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { 
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          select: { id: true, product_id: true, quantity: true, quantity_received: true, cost: true, product: { select: { id: true, name: true, legacy_code: true } } }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })
    res.json(orders)
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    res.status(500).json({ error: 'Error al obtener órdenes de compra' })
  }
}

const getReceptions = async (req, res) => {
  try {
    const receptions = await prisma.reception.findMany({
      include: {
        purchase_order: {
          include: {
            supplier: { select: { id: true, name: true } },
            warehouse: { select: { id: true, name: true } },
            items: {
              select: { id: true, product_id: true, quantity: true, quantity_received: true, cost: true, product: { select: { id: true, name: true, legacy_code: true } } }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })
    res.json(receptions)
  } catch (error) {
    console.error('Error fetching receptions:', error)
    res.status(500).json({ error: 'Error al obtener recepciones' })
  }
}

const getReceptionDetail = async (req, res) => {
  const { id } = req.params
  try {
    const reception = await prisma.reception.findUnique({
      where: { id },
      include: {
        purchase_order: { include: { supplier: true, warehouse: true } },
        items: { include: { product: true } }
      }
    })
    if (!reception) return res.status(404).json({ error: 'Recepción no encontrada' })
    res.json(reception)
  } catch (error) {
    console.error('Error fetching reception detail:', error)
    res.status(500).json({ error: 'Error al obtener detalle de recepción' })
  }
}

const createReception = async (req, res) => {
  try {
    const { purchase_order_id, observations, items, warehouse_id, received_by, billed_amount } = req.body
    const systemUserId = req.user?.id || 'SISTEMA'
    
    if (!warehouse_id) {
      return res.status(400).json({ error: 'El almacén de destino es obligatorio' })
    }

    const reception = await prisma.$transaction(async (tx) => {
      const oc = await tx.purchaseOrder.findUnique({ 
        where: { id: purchase_order_id },
        include: { items: true, supplier: true }
      })
      if (!oc) throw new Error('Orden no encontrada')

      let physicalTotalValue = 0;

      // 1. Create the Reception header
      const newReception = await tx.reception.create({
        data: { 
          purchase_order_id, 
          received_by: received_by || systemUserId,
          observations,
          billed_amount: parseFloat(billed_amount || 0)
        }
      })

      // 2. Process each item received
      for (const item of items) {
        const receivedQty = parseInt(item.quantity);
        if (receivedQty <= 0) continue;

        // Find the specific item in the PO to get its cost
        const poItem = oc.items.find(i => i.product_id === item.product_id);
        const unitCost = poItem ? poItem.cost : 0;
        physicalTotalValue += (receivedQty * unitCost);

        // Create the individual reception item record
        await tx.receptionItem.create({
          data: {
            reception_id: newReception.id,
            product_id: item.product_id,
            quantity: receivedQty,
            cost: unitCost
          }
        })

        // Update the Purchase Order Item progress
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { 
              quantity_received: { increment: receivedQty }
            }
          })
        }

        // 3. Update Inventory Stock
        const stock = await updateStock({
          productId: item.product_id,
          branchId: warehouse_id, 
          quantity: receivedQty,
          type: 'IN',
          reason: 'RECEPTION',
          reference: newReception.id,
          userId: systemUserId,
          tx // Pass transaction if updateStock supports it (need to check stockService)
        })

        // 4. Update Product Costs (Last Cost and Average Cost)
        const product = await tx.product.findUnique({ where: { id: item.product_id } });
        if (product) {
          const currentStockTotal = await tx.stock.aggregate({
            where: { product_id: product.id },
            _sum: { quantity: true }
          });
          const totalStockBefore = (currentStockTotal._sum.quantity || 0) - receivedQty;
          
          // Formula: ((StockAntes * CostoPromAntes) + (Recibido * CostoNuevo)) / StockTotal
          // Note: costs are in cents (Int)
          const oldAvgCost = product.avg_cost || product.last_cost || 0;
          const newCost = Math.round(unitCost * 100); // UI costs are likely floats, convert to cents
          
          let newAvgCost = newCost;
          const totalStockAfter = totalStockBefore + receivedQty;
          
          if (totalStockAfter > 0) {
            newAvgCost = Math.round(((totalStockBefore * oldAvgCost) + (receivedQty * newCost)) / totalStockAfter);
          }

          await tx.product.update({
            where: { id: product.id },
            data: {
              last_cost: newCost,
              avg_cost: newAvgCost
            }
          });
        }
      }

      // 5. Update Reception with Calculated Total
      await tx.reception.update({
        where: { id: newReception.id },
        data: { total_amount: physicalTotalValue }
      });

      // 6. Create Supplier Payment (Accounts Payable) - STATUS: Por Validar
      const creditDays = oc.supplier?.credit_days || 0;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + creditDays);

      const poTotalValue = oc.total_amount || 0; // Standard PO total

      const payment = await tx.supplierPayment.create({
        data: {
          supplier_id: oc.supplier_id,
          reception_id: newReception.id,
          purchase_order_id: oc.id,
          reception_value: physicalTotalValue,
          po_total_value: poTotalValue,
          amount: physicalTotalValue, // Start with the physical value, accountant will adjust
          balance: physicalTotalValue,
          due_date: dueDate,
          status: 'Por Validar'
        }
      });

      // 8. Update Purchase Order Status
      const updatedItems = await tx.purchaseOrderItem.findMany({ 
        where: { purchase_order_id } 
      })
      
      const allReceived = updatedItems.every(i => i.quantity_received >= i.quantity)
      const anyReceived = updatedItems.some(i => i.quantity_received > 0)

      await tx.purchaseOrder.update({
        where: { id: purchase_order_id },
        data: { status: allReceived ? 'Recepcionado' : (anyReceived ? 'Parcialmente Recepcionado' : 'Pendiente') }
      })

      return { reception: newReception, payment };
    })

    res.json(reception)
  } catch (error) {
    console.error('Error al procesar recepción:', error)
    res.status(500).json({ error: 'Error al procesar recepción: ' + error.message })
  }
}

const cancelReception = async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id || 'SISTEMA'
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check Reception and CP status
      const reception = await tx.reception.findUnique({
        where: { id },
        include: { 
          items: true, 
          payments: { where: { status: { not: 'Cancelado' } } },
          purchase_order: true
        }
      })

      if (!reception) throw new Error('Recepción no encontrada')
      if (reception.status === 'Cancelada') throw new Error('La recepción ya está cancelada')

      const payment = reception.payments[0]
      if (payment && payment.status !== 'Por Validar') {
        throw new Error(`No se puede cancelar la recepción: El pago está en estado '${payment.status}'. Debe revertirse en Contabilidad primero.`)
      }

      // 2. Revert Stock for each item
      // We need the warehouse_id from the PO or a default fallback
      let warehouseId = reception.purchase_order.warehouse_id
      
      if (!warehouseId) {
        // Fallback to the first available warehouse if PO doesn't have one
        const fallbackWarehouse = await tx.branch.findFirst();
        if (!fallbackWarehouse) throw new Error('No se puede cancelar: No hay almacenes configurados en el sistema.')
        warehouseId = fallbackWarehouse.id;
        console.warn(`Cancelando recepción ${id} usando almacén de respaldo: ${fallbackWarehouse.name}`);
      }
      
      for (const item of reception.items) {
        await updateStock({
          productId: item.product_id,
          branchId: warehouseId,
          quantity: -item.quantity, // SUBTRACT
          type: 'OUT',
          reason: 'CANCEL_RECEPTION',
          reference: reception.id,
          userId,
          tx
        })

        // 3. Decrement quantity_received in PO items
        await tx.purchaseOrderItem.updateMany({
          where: { 
            purchase_order_id: reception.purchase_order_id,
            product_id: item.product_id
          },
          data: {
             quantity_received: { decrement: item.quantity }
          }
        })
      }

      // 4. Update Reception and Payment status
      await tx.reception.update({
        where: { id },
        data: { 
          status: 'Cancelada',
          canceled_at: new Date(),
          canceled_by: userId
        }
      })

      if (payment) {
        await tx.supplierPayment.update({
          where: { id: payment.id },
          data: { 
            status: 'Cancelado',
            canceled_at: new Date(),
            canceled_by: userId
          }
        })
      }

      // 5. Update Purchase Order Status (re-calculate)
      const allPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchase_order_id: reception.purchase_order_id }
      })
      
      const anyReceived = allPoItems.some(i => i.quantity_received > 0)
      const allReceived = allPoItems.every(i => i.quantity_received >= i.quantity)
      
      await tx.purchaseOrder.update({
        where: { id: reception.purchase_order_id },
        data: { status: allReceived ? 'Recepcionado' : (anyReceived ? 'Parcialmente Recepcionado' : 'Pendiente') }
      })

      return { success: true }
    })

    res.json(result)
  } catch (error) {
    console.error('Error cancelling reception:', error)
    res.status(500).json({ error: error.message })
  }
}

const cancelPurchaseOrder = async (req, res) => {
  const { id } = req.params
  try {
    const oc = await prisma.purchaseOrder.findUnique({ 
        where: { id },
        include: { receptions: { where: { status: 'Activa' } } }
    })
    if (!oc) return res.status(404).json({ error: 'Orden no encontrada' })
    if (oc.receptions.length > 0) {
        return res.status(400).json({ error: 'No se puede cancelar una orden con recepciones activas.' })
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'Cancelada' }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar orden: ' + error.message })
  }
}

const searchPurchaseOrders = async (req, res) => {
  const { query } = req.query
  if (!query) return res.json([])
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { folio: { contains: query, mode: 'insensitive' } },
          { supplier: { name: { contains: query, mode: 'insensitive' } } }
        ]
      },
      include: {
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: { select: { id: true, product_id: true, quantity: true, quantity_received: true, cost: true, product: { select: { id: true, name: true, legacy_code: true } } } }
      },
      orderBy: { created_at: 'desc' },
      take: 20
    })
    res.json(orders)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al buscar órdenes' })
  }
}

const searchReceptions = async (req, res) => {
  const { query } = req.query
  if (!query) return res.json([])
  try {
    const receptions = await prisma.reception.findMany({
      where: {
        OR: [
          { purchase_order: { folio: { contains: query, mode: 'insensitive' } } },
          { purchase_order: { supplier: { name: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        purchase_order: {
          include: {
            supplier: { select: { id: true, name: true } },
            warehouse: { select: { id: true, name: true } },
            items: {
              select: { id: true, product_id: true, quantity: true, cost: true, product: { select: { id: true, name: true, legacy_code: true } } }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 20
    })
    res.json(receptions)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al buscar recepciones' })
  }
}

const createPurchaseOrder = async (req, res) => {
  const { items, subtotal, taxes, total_amount, observations } = req.body;
  // Normalizar todos los FKs: string vacío -> null
  const supplier_id = req.body.supplier_id || null;
  const warehouse_id = req.body.warehouse_id || null;
  
  if (!supplier_id) return res.status(400).json({ error: 'Se requiere un proveedor válido' });
  if (!items || items.length === 0) return res.status(400).json({ error: 'Se requiere al menos un artículo' });

  try {
    const order = await prisma.$transaction(async (tx) => {
      const timestampFolio = `OC-MAN-${Date.now().toString().slice(-6)}`;

      const newOrder = await tx.purchaseOrder.create({
        data: {
          folio: timestampFolio,
          supplier_id,
          warehouse_id,
          status: 'Pendiente',
          subtotal: parseFloat(subtotal || 0),
          taxes: parseFloat(taxes || 0),
          total_amount: parseFloat(total_amount || 0),
          observations: observations || null,
          created_at: new Date(),
          items: {
            create: items
              .filter(item => item.product_id) // Descartar ítems sin producto
              .map(item => ({
                product_id: item.product_id,
                quantity: parseInt(item.quantity || 1),
                cost: parseFloat(item.cost || 0),
                warehouse_id
              }))
          }
        },
        include: { supplier: true, items: { include: { product: true } } }
      });
      return newOrder;
    });
    res.json(order);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Error al crear orden: ' + error.message })
  }
}

const updatePurchaseOrder = async (req, res) => {
  const { id } = req.params
  const { items, supplier_id, warehouse_id, observations, subtotal, taxes, total_amount } = req.body
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate no active receptions
      const oc = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { receptions: { where: { status: 'Activa' } } }
      })
      if (!oc) throw new Error('Orden no encontrada')
      if (oc.receptions.length > 0) {
        throw new Error('No se puede editar una orden que ya tiene recepciones activas.')
      }

      // 2. Clear old items
      await tx.purchaseOrderItem.deleteMany({ where: { purchase_order_id: id } })

      // 3. Update main record and create new items
      return await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplier_id,
          warehouse_id,
          observations,
          subtotal: parseFloat(subtotal || 0),
          taxes: parseFloat(taxes || 0),
          total_amount: parseFloat(total_amount || 0),
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: parseInt(item.quantity || 1),
              cost: parseFloat(item.cost || 0),
              warehouse_id: warehouse_id
            }))
          }
        },
        include: { items: true }
      })
    })

    res.json(result)
  } catch (error) {
    console.error('Error updating OC:', error)
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getPurchaseOrders, getReceptions, createReception, searchPurchaseOrders, searchReceptions, createPurchaseOrder, getReceptionDetail, cancelReception, cancelPurchaseOrder, updatePurchaseOrder }
