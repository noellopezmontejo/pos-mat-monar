const { prisma } = require('../db')

const getReceivables = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  const skip = (page - 1) * limit

  const status = req.query.status

  try {
    const where = {
      folio: { startsWith: 'SL-' }
    }

    if (status) {
        if (status === 'Pendiente') {
            where.OR = [{ status: 'PENDING' }, { status: 'PENDIENTE' }, { type: 'anticipo' }, { status: 'PENDIENTE_COBRO' }, { status: 'COBRADO_CHOFER' }]
        } else if (status === 'Pagado') {
            where.OR = [{ status: 'PAID' }, { status: 'PAGADO' }, { status: 'LIQUIDADO' }]
        } else {
            where.status = status
        }
    }

    const activeSession = await prisma.cashSession.findFirst({
      where: { user_id: req.user.id, status: 'OPEN' }
    })

    if (!activeSession) {
      return res.json({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 1 } })
    }

    // Lógica para que el cajero pueda ver:
    // 1. Lo Pagado/Liquidado en SU turno (updated_at >= session.opened_at)
    // 2. Lo Pendiente de cualquier fecha (para que pueda cobrar ventas de ayer)
    if (status === 'Pagado') {
      where.updated_at = { gte: activeSession.opened_at }
    } else if (status === 'Pendiente' || status === 'Por Validar') {
      // No filtramos por fecha, mostramos todo el rezago para que lo puedan cobrar hoy
    } else {
      // Por defecto a otras pestañas, solo lo de hoy
      where.created_at = { gte: activeSession.opened_at }
    }

    const [receivables, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ])

    res.json({
      data: receivables,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching receivables:', error)
    res.status(500).json({ error: 'Error al obtener cuentas por cobrar' })
  }
}

const recordPayment = async (req, res) => {
  const { saleId, amount, method, reference } = req.body
  const userId = req.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId }
      })

      if (!sale) throw new Error('Venta no encontrada')

      // Para este MVP, si el pago es >= al total_amount (o lo que falte), marcamos como PAID
      // En una versión más compleja usaríamos una tabla de transacciones de pagos de clientes
      
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'PAID' // Por ahora simplificado a pago total
        }
      })

      return updatedSale
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const { updateStock } = require('../utils/stockService')

const cancelSale = async (req, res) => {
  const { saleId } = req.body
  const userId = req.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true, delivery: true }
      })

      if (!sale) throw new Error('Venta no encontrada')
      
      const s = sale.status.toUpperCase()
      if (s === 'PAID' || s === 'LIQUIDADO' || s === 'CANCELLED') {
        throw new Error(`No se puede cancelar una venta en estado ${sale.status}`)
      }

      // Restore inventory
      for (const item of sale.items) {
        if (sale.type === 'ADVANCE') {
           await tx.stock.update({
             where: { product_id_branch_id: { product_id: item.product_id, branch_id: item.warehouse_id } },
             data: { committed: { decrement: item.quantity } }
           })
           // Kardex
           await tx.kardex.create({
             data: {
               product_id: item.product_id,
               type: 'CANCEL_COMMIT',
               reason: 'CANCEL_SALE',
               quantity: item.quantity,
               balance: 0,
               reference: sale.id,
               user_id: userId
             }
           })
        } else {
           await updateStock({
             productId: item.product_id,
             branchId: item.warehouse_id,
             tx,
             quantity: item.quantity, // Add back
             type: 'IN',
             reason: 'CANCEL_SALE',
             reference: sale.id,
             userId
           })
        }
      }

      // Mark Delivery as CANCELLED if exists
      if (sale.delivery) {
        await tx.delivery.update({
          where: { id: sale.delivery.id },
          data: { status: 'CANCELLED' }
        })
      }

      // Update sale
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' }
      })

      return updatedSale
    })

    res.json(result)
  } catch (error) {
    console.error('Error cancelling sale:', error)
    res.status(500).json({ error: error.message })
  }
}

const bulkCancel = async (req, res) => {
  const { saleIds } = req.body
  const userId = req.user.id

  if (!saleIds || !Array.isArray(saleIds) || saleIds.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron ventas para cancelar' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let cancelledCount = 0
      for (const saleId of saleIds) {
        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          include: { items: true, delivery: true }
        })

        if (!sale) continue
        
        const s = sale.status.toUpperCase()
        if (s === 'PAID' || s === 'LIQUIDADO' || s === 'CANCELLED') continue

        // Restore inventory
        for (const item of sale.items) {
          if (sale.type === 'ADVANCE') {
             await tx.stock.update({
               where: { product_id_branch_id: { product_id: item.product_id, branch_id: item.warehouse_id } },
               data: { committed: { decrement: item.quantity } }
             })
             // Kardex
             await tx.kardex.create({
               data: {
                 product_id: item.product_id,
                 type: 'CANCEL_COMMIT',
                 reason: 'CANCEL_SALE',
                 quantity: item.quantity,
                 balance: 0,
                 reference: sale.id,
                 user_id: userId
               }
             })
          } else {
             await updateStock({
               productId: item.product_id,
               branchId: item.warehouse_id,
               tx,
               quantity: item.quantity,
               type: 'IN',
               reason: 'CANCEL_SALE',
               reference: sale.id,
               userId
             })
          }
        }

        if (sale.delivery) {
          await tx.delivery.update({
            where: { id: sale.delivery.id },
            data: { status: 'CANCELLED' }
          })
        }

        await tx.sale.update({
          where: { id: saleId },
          data: { status: 'CANCELLED' }
        })
        cancelledCount++
      }

      return { cancelledCount }
    })

    res.json(result)
  } catch (error) {
    console.error('Error in bulk cancel:', error)
    res.status(500).json({ error: error.message })
  }
}

const bulkPayment = async (req, res) => {
  const { saleIds, method, reference } = req.body
  
  if (!saleIds || !Array.isArray(saleIds) || saleIds.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron ventas para cobrar' })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let paidCount = 0
      for (const saleId of saleIds) {
        const sale = await tx.sale.findUnique({
          where: { id: saleId }
        })

        if (!sale) continue
        const s = sale.status.toUpperCase()
        if (s === 'PAID' || s === 'LIQUIDADO' || s === 'CANCELLED') continue
        
        await tx.sale.update({
          where: { id: saleId },
          data: {
            status: 'PAID',
            payment_method: method,
            liquidated_at: new Date(),
            liquidated_by: req.user.id
          }
        })
        paidCount++
      }
      return { paidCount }
    })

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getReceivables, recordPayment, cancelSale, bulkCancel, bulkPayment }
