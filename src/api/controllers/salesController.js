const { prisma } = require('../db')
const { updateStock } = require('../utils/stockService')

const createSale = async (req, res) => {
  let { customer_id, type, items, branch_id, payment_method, is_delivery, delivery_address, received_amount, delivery_notes } = req.body
  const userId = req.user.id

  // Coerce is_delivery to actual boolean regardless of how frontend sends it
  is_delivery = is_delivery === true || is_delivery === 'true' || is_delivery === 1

  try {
    // 1. Resolve customer if missing (for POS)
    if (!customer_id) {
       console.log('[Sales] No customer_id provided, looking for default...');
       let publicCustomer = await prisma.customer.findFirst({
         where: { 
           OR: [
             { name: { contains: 'Mostrador', mode: 'insensitive' } }, 
             { name: { contains: 'Publico', mode: 'insensitive' } },
             { legacy_code: '0' }
           ] 
         }
       });
       
       if (!publicCustomer) {
         console.log('[Sales] No default customer found, using first available...');
         publicCustomer = await prisma.customer.findFirst();
       }

       if (!publicCustomer) {
         return res.status(400).json({ error: 'No existen clientes en el sistema. Debe registrar al menos uno.' });
       }

       customer_id = publicCustomer.id;
       console.log('[Sales] Using customer:', publicCustomer.name, customer_id);
    }

    // 2. Resolve branch if missing
    if (!branch_id) {
       const branch = await prisma.branch.findFirst();
       if (!branch) throw new Error('No hay sucursales configuradas');
       branch_id = branch.id;
    }

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Header
      const newSale = await tx.sale.create({
        data: {
          folio: `SL-${Date.now()}`,
          customer_id,
          type,
          status: type === 'ADVANCE' ? 'PENDING' : (['CONTRA_ENTREGA', 'PAGO_EN_CAJA'].includes(payment_method) ? 'PENDIENTE_COBRO' : 'PAID'),
          payment_method,
          created_by: userId,
          warehouse_id: branch_id,
          total_amount: items.reduce((acc, i) => acc + (i.quantity * i.price - (i.discount || 0)), 0),
          subtotal: items.reduce((acc, i) => acc + (i.quantity * i.price), 0),
          discount: items.reduce((acc, i) => acc + (i.discount || 0), 0),
          balance: payment_method === 'CREDIT_STORE' ? items.reduce((acc, i) => acc + (i.quantity * i.price - (i.discount || 0)), 0) : 0,
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: parseFloat(item.price),
              discount: parseFloat(item.discount || 0),
              unit: item.unit,
              warehouse_id: branch_id
            }))
          }
        }
      })

      // 1.5 Create Delivery if requested
      if (is_delivery === true) {
        const addr = (delivery_address && delivery_address.trim()) || 'Dirección del Cliente'
        console.log('[Sales] Creating delivery record, address:', addr)
        await tx.delivery.create({
          data: {
            sale_id: newSale.id,
            status: 'PENDING',
            address: addr,
            proof_notes: delivery_notes || null
          }
        })
      } else {
        console.log('[Sales] No delivery requested. is_delivery =', is_delivery)
      }

      // 2. Handle Inventory based on Type
      for (const item of items) {
        if (type === 'ADVANCE') {
           // For advances, we only increment "committed" stock
           await tx.stock.upsert({
             where: { product_id_branch_id: { product_id: item.product_id, branch_id } },
             update: { committed: { increment: item.quantity } },
             create: { product_id: item.product_id, branch_id, quantity: 0, committed: item.quantity }
           })
           // record commitment in Kardex
           await tx.kardex.create({
             data: {
               product_id: item.product_id,
               type: 'COMMIT',
               reason: 'ADVANCE_SALE',
               quantity: item.quantity,
               balance: 0, // logic for balance in commitments needs refinement
               reference: newSale.id,
               user_id: userId
             }
           })
        } else {
           // For POS and Remissions, we subtract physical stock
           await updateStock({
             productId: item.product_id,
             branchId: branch_id,
             tx,
             quantity: -item.quantity,
             type: 'OUT',
             reason: 'SALE',
             reference: newSale.id,
             userId
           })
        }
      }

      return newSale
    })

    // Re-fetch with user (seller/cajero) and customer info for the ticket
    const fullSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        items: { include: { product: true } },
        warehouse: true
      }
    })

    // Attach seller info from the authenticated user
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, role: true }
    })
    fullSale.seller = seller

    res.json(fullSale)
  } catch (error) {
    console.error('Error al crear venta detallado:', error)
    res.status(500).json({ 
      error: 'Error al procesar la venta',
      message: error.message,
      stack: error.stack
    })
  }
}

const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: { product: true, warehouse: true }
        },
        cfdis: true
      },
      orderBy: { created_at: 'desc' },
      take: 50
    })
    res.json(sales)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener ventas' })
  }
}

module.exports = { createSale, getSales }
