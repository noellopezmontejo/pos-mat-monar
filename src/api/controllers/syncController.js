const { prisma } = require('../db')

const syncFromPWA = async (req, res) => {
  const { operations } = req.body // Array of { type, table, payload, timestamp }
  const userId = req.user.id

  try {
    const results = await prisma.$transaction(async (tx) => {
      const synced = []
      for (const op of operations) {
        try {
          if (op.table === 'receptions') {
            const { purchase_order_id, observations, items, warehouse_id, received_by } = op.payload;
            
            // 1. Create the Reception header
            const newReception = await tx.reception.create({
              data: { 
                purchase_order_id, 
                received_by: received_by || userId,
                observations,
                status: 'Activa'
              }
            })

            // 2. Process each item received
            for (const item of items) {
              const receivedQty = parseInt(item.quantity);
              if (receivedQty <= 0) continue;

              // Find the specific item in the PO to get its cost
              const poItem = await tx.purchaseOrderItem.findFirst({
                 where: { purchase_order_id, product_id: item.product_id }
              });

              // Create the individual reception item record
              await tx.receptionItem.create({
                data: {
                  reception_id: newReception.id,
                  product_id: item.product_id,
                  quantity: receivedQty,
                  cost: poItem ? poItem.cost : 0
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
              const existingStock = await tx.stock.findFirst({
                where: { product_id: item.product_id, branch_id: warehouse_id }
              })

              const stock = await tx.stock.upsert({
                where: { id: existingStock?.id || 'new' },
                update: { quantity: { increment: receivedQty } },
                create: { product_id: item.product_id, branch_id: warehouse_id, quantity: receivedQty }
              })

              await tx.kardex.create({
                data: {
                  product_id: item.product_id,
                  branch_id: warehouse_id,
                  type: 'IN',
                  reason: 'RECEPTION_SYNC',
                  quantity: receivedQty,
                  balance: stock.quantity,
                  reference: newReception.id,
                  user_id: userId
                }
              })
            }

      // 4. Update the Purchase Order status
      const updatedItems = await tx.purchaseOrderItem.findMany({ 
        where: { purchase_order_id } 
      })
      
      const allReceived = updatedItems.every(i => i.quantity_received >= i.quantity)
      const anyReceived = updatedItems.some(i => i.quantity_received > 0)

      await tx.purchaseOrder.update({
        where: { id: purchase_order_id },
        data: { status: allReceived ? 'Recepcionado' : (anyReceived ? 'Parcialmente Recepcionado' : 'Pendiente') }
      })

      // 5. Create Supplier Payment (Accounts Payable) - STATUS: Por Validar
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchase_order_id },
        include: { supplier: true }
      })

      // Calculate the value of THIS reception (items in the current sync loop)
      let physicalTotalValue = 0;
      for (const item of items) {
        const poItem = await tx.purchaseOrderItem.findFirst({
           where: { purchase_order_id, product_id: item.product_id }
        });
        if (poItem) {
          physicalTotalValue += (parseInt(item.quantity) * poItem.cost);
        }
      }

      const creditDays = po.supplier?.credit_days || 0;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + creditDays);

      await tx.supplierPayment.create({
        data: {
          supplier_id: po.supplier_id,
          reception_id: newReception.id,
          purchase_order_id: po.id,
          reception_value: physicalTotalValue,
          po_total_value: po.total_amount,
          amount: physicalTotalValue, 
          balance: physicalTotalValue,
          due_date: dueDate,
          status: 'Por Validar'
        }
      });

          } else if (op.table === 'adjustments') {
            const { product_id, branch_id, quantity, reason, type } = op.payload
            const currentStock = await tx.stock.upsert({
              where: { product_id_branch_id: { product_id, branch_id } },
              update: { quantity: { increment: quantity } },
              create: { product_id, branch_id, quantity }
            })
            await tx.kardex.create({
              data: {
                product_id,
                branch_id,
                type: type || (quantity >= 0 ? 'IN' : 'OUT'),
                reason: reason || 'Ajuste Offline',
                quantity: Math.abs(quantity),
                balance: currentStock.quantity,
                user_id: userId,
                reference: 'SYNC_PWA'
              }
            })
          } else if (op.table === 'transfers') {
            const { product_id, from_branch_id, to_branch_id, quantity, observations } = op.payload
            
            const updatedSource = await tx.stock.update({
              where: { product_id_branch_id: { product_id, branch_id: from_branch_id } },
              data: { quantity: { decrement: quantity } }
            })
            const updatedDest = await tx.stock.upsert({
              where: { product_id_branch_id: { product_id, branch_id: to_branch_id } },
              update: { quantity: { increment: quantity } },
              create: { product_id, branch_id: to_branch_id, quantity }
            })

            await tx.kardex.create({
              data: {
                product_id, branch_id: from_branch_id, type: 'OUT',
                reason: `Transf. a ${to_branch_id} (Sync)`,
                quantity, balance: updatedSource.quantity, user_id: userId, reference: observations
              }
            })
            await tx.kardex.create({
              data: {
                product_id, branch_id: to_branch_id, type: 'IN',
                reason: `Transf. desde ${from_branch_id} (Sync)`,
                quantity, balance: updatedDest.quantity, user_id: userId, reference: observations
              }
            })
          }
          
          synced.push({ local_id: op.id, status: 'success' })
        } catch (e) {
          console.error(`Error syncing op ${op.id}:`, e)
          synced.push({ local_id: op.id, status: 'error', message: e.message })
        }
      }
      return synced
    })
    res.json({ status: 'synced', results })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la sincronización' })
  }
}

module.exports = { syncFromPWA }
