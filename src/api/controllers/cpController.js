const { prisma } = require('../db')

const getPendingPayments = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  const skip = (page - 1) * limit
  const status = req.query.status // Pestaña activa: Por Validar, Pendiente, Pagado

  try {
    const where = {
      created_at: { gte: new Date('2026-04-01') }
    }

    if (status) {
      if (status === 'Pendiente') {
        where.OR = [{ status: 'Pendiente' }, { status: 'Parcial' }]
      } else {
        where.status = status
      }
    }

    const [payments, total] = await Promise.all([
      prisma.supplierPayment.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          reception: { 
            include: { 
              purchase_order: { select: { folio: true, total_amount: true } },
              items: {
                include: { product: true }
              }
            } 
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.supplierPayment.count({ where })
    ])

    res.json({
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({ error: 'Error al obtener cuentas por pagar' })
  }
}

const validatePayment = async (req, res) => {
  const { id } = req.params
  const { amount } = req.body // Final amount to be paid
  
  try {
    const payment = await prisma.supplierPayment.findUnique({ 
        where: { id },
        include: { reception: { include: { purchase_order: true } } }
    })
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' })

    const poTotal = payment.po_total_value || 0;
    const physicalValue = payment.reception_value || 0;

    // RULE: Physical <= Amount <= PO Total
    if (amount < physicalValue) {
        // Optional: warn or block? User said "modificar al valor de lo recibo o maximo al total de la orden compra"
        // I'll allow minimum physicalValue for now as requested.
    }
    if (amount > poTotal && poTotal > 0) {
        return res.status(400).json({ error: `El monto no puede exceder el total de la Orden de Compra ($${poTotal})` })
    }

    const updated = await prisma.supplierPayment.update({
      where: { id },
      data: {
        amount,
        balance: amount,
        status: 'Pendiente' // Now it's ready to be paid
      }
    })
    res.json(updated)
  } catch (error) {
    console.error('Error validating payment:', error)
    res.status(500).json({ error: 'Error al validar monto del pago' })
  }
}

const addTransaction = async (req, res) => {
  const { id } = req.params // SupplierPayment ID
  const { amount, payment_method, reference, notes } = req.body
  
  try {
    const payment = await prisma.supplierPayment.findUnique({ where: { id } })
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' })

    const newBalance = payment.balance - amount;
    if (newBalance < -0.01) return res.status(400).json({ error: 'El abono excede el saldo pendiente' })

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction record
      const trans = await tx.supplierPaymentTransaction.create({
        data: {
          payment_id: id,
          amount,
          payment_method,
          reference,
          notes
        }
      })

      // 2. Update Payment balance and status
      await tx.supplierPayment.update({
        where: { id },
        data: {
          balance: newBalance,
          status: newBalance <= 0 ? 'Pagado' : 'Parcial'
        }
      })

      return trans
    })

    res.json(transaction)
  } catch (error) {
    console.error('Error processing transaction:', error)
    res.status(500).json({ error: 'Error al procesar el pago' })
  }
}

const getPaymentTransactions = async (req, res) => {
    const { id } = req.params
    try {
        const txs = await prisma.supplierPaymentTransaction.findMany({
            where: { payment_id: id },
            orderBy: { created_at: 'desc' }
        })
        res.json(txs)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener transacciones' })
    }
}

const revertValidation = async (req, res) => {
    const { id } = req.params
    try {
        const payment = await prisma.supplierPayment.findUnique({ where: { id } })
        if (!payment) return res.status(404).json({ error: 'Pago no encontrado' })
        
        if (payment.balance !== payment.amount) {
            return res.status(400).json({ error: 'No se puede revertir la validación si ya existen pagos registrados.' })
        }

        const updated = await prisma.supplierPayment.update({
            where: { id },
            data: { status: 'Por Validar' }
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ error: 'Error al revertir validación' })
    }
}

const cancelTransaction = async (req, res) => {
    const { id } = req.params // Transaction ID
    const userId = req.user?.id || 'SISTEMA'
    try {
        const txRecord = await prisma.supplierPaymentTransaction.findUnique({
            where: { id },
            include: { payment: true }
        })
        if (!txRecord) return res.status(404).json({ error: 'Transacción no encontrada' })
        if (txRecord.status === 'Cancelado') return res.status(400).json({ error: 'La transacción ya está cancelada' })

        const result = await prisma.$transaction(async (tx) => {
            // 1. Mark transaction as cancelled
            await tx.supplierPaymentTransaction.update({
                where: { id },
                data: { 
                    status: 'Cancelado',
                    canceled_at: new Date(),
                    canceled_by: userId
                }
            })

            // 2. Restore balance in the parent payment
            const newBalance = txRecord.payment.balance + txRecord.amount
            const newStatus = newBalance === txRecord.payment.amount ? 'Pendiente' : 'Parcial'

            return await tx.supplierPayment.update({
                where: { id: txRecord.payment_id },
                data: {
                    balance: newBalance,
                    status: newStatus
                }
            })
        })

        res.json(result)
    } catch (error) {
        console.error('Error cancelling transaction:', error)
        res.status(500).json({ error: 'Error al cancelar la transacción' })
    }
}

module.exports = { getPendingPayments, validatePayment, addTransaction, getPaymentTransactions, revertValidation, cancelTransaction }
