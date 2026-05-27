const { prisma } = require('../db')

// GET /api/collections/customers
// Obtiene todos los clientes que tienen deudas (Sales con balance > 0)
const getDebtors = async (req, res) => {
  try {
    const debtors = await prisma.customer.findMany({
      where: {
        sales: {
          some: {
            balance: { gt: 0 },
            payment_method: 'CREDIT_STORE'
          }
        }
      },
      include: {
        sales: {
          where: {
            balance: { gt: 0 },
            payment_method: 'CREDIT_STORE'
          }
        }
      }
    })

    const data = debtors.map(c => {
      const totalDebt = c.sales.reduce((acc, sale) => acc + (sale.balance || 0), 0)
      
      // Calculate overdue balance
      const now = new Date()
      let overdueBalance = 0
      c.sales.forEach(sale => {
        const dueDate = new Date(sale.created_at)
        dueDate.setDate(dueDate.getDate() + (c.credit_days || 0))
        if (now > dueDate) {
          overdueBalance += (sale.balance || 0)
        }
      })

      return {
        id: c.id,
        name: c.name,
        legacy_code: c.legacy_code,
        credit_limit: c.credit_limit,
        credit_days: c.credit_days,
        total_debt: totalDebt,
        overdue_balance: overdueBalance,
        status: overdueBalance > 0 ? 'OVERDUE' : 'OK',
        pending_sales_count: c.sales.length
      }
    })

    // Sort by largest debt first
    data.sort((a, b) => b.total_debt - a.total_debt)

    res.json(data)
  } catch (error) {
    console.error('Error fetching debtors:', error)
    res.status(500).json({ error: 'Error al obtener deudores' })
  }
}

// GET /api/collections/statement/:customerId
const getStatement = async (req, res) => {
  const { customerId } = req.params

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          where: {
            payment_method: 'CREDIT_STORE'
          },
          orderBy: { created_at: 'desc' }
        },
        customer_payments: {
          orderBy: { created_at: 'desc' },
          take: 50,
          include: {
            sale: {
              select: { folio: true }
            }
          }
        }
      }
    })

    if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' })

    const totalDebt = customer.sales.filter(s => s.balance > 0).reduce((acc, s) => acc + s.balance, 0)

    res.json({
      customer,
      total_debt: totalDebt,
      available_credit: Math.max(0, (customer.credit_limit || 0) - totalDebt)
    })
  } catch (error) {
    console.error('Error fetching statement:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/collections/payment
const registerPayment = async (req, res) => {
  const { customerId, amount, method, reference, saleIds } = req.body
  const userId = req.user.id

  if (!customerId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Datos de pago inválidos' })
  }

  // Multiply by 100 to handle cents
  let remainingAmount = amount

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the overall payment record (we can tie it to a sale or keep it general)
      const paymentRecord = await tx.customerPayment.create({
        data: {
          customer_id: customerId,
          amount: remainingAmount,
          payment_method: method,
          reference: reference || null,
          created_by: userId
        }
      })

      // Get pending sales
      const whereClause = {
        customer_id: customerId,
        balance: { gt: 0 },
        payment_method: 'CREDIT_STORE'
      }

      // If specific sales are provided, only target those
      if (saleIds && Array.isArray(saleIds) && saleIds.length > 0) {
        whereClause.id = { in: saleIds }
      }

      const pendingSales = await tx.sale.findMany({
        where: whereClause,
        orderBy: { created_at: 'asc' } // Oldest first
      })

      for (const sale of pendingSales) {
        if (remainingAmount <= 0) break

        const balance = sale.balance || 0
        const toPay = Math.min(balance, remainingAmount)

        const newBalance = balance - toPay
        remainingAmount -= toPay

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            balance: newBalance,
            status: newBalance === 0 ? 'PAID' : sale.status,
            liquidated_at: newBalance === 0 ? new Date() : sale.liquidated_at,
            liquidated_by: newBalance === 0 ? userId : sale.liquidated_by
          }
        })
      }

      return paymentRecord
    })

    res.json(result)
  } catch (error) {
    console.error('Error registering payment:', error)
    res.status(500).json({ error: 'Error interno al registrar abono' })
  }
}

module.exports = { getDebtors, getStatement, registerPayment }
