const { prisma } = require('../db')

const getCurrentSession = async (req, res) => {
  const userId = req.user.id
  try {
    const session = await prisma.cashSession.findFirst({
      where: { user_id: userId, status: 'OPEN' },
      orderBy: { opened_at: 'desc' }
    })
    
    if (!session) {
      return res.status(404).json({ message: 'No hay caja abierta para este usuario' })
    }

    // VERIFICACIÓN DE CIERRE DIARIO FORZOSO
    // Si la caja se abrió en un día distinto al actual, forzar cierre.
    const today = new Date().toISOString().split('T')[0]
    const sessionDay = session.opened_at.toISOString().split('T')[0]
    
    if (sessionDay !== today) {
       return res.status(200).json({ 
         ...session, 
         force_close: true, 
         warning: 'Debes realizar el corte del día anterior antes de continuar.' 
       })
    }
    
    res.json(session)
  } catch (error) {
    console.error('Error fetching cash session:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const openSession = async (req, res) => {
  const userId = req.user.id
  const { opening_balance } = req.body

  try {
    const existing = await prisma.cashSession.findFirst({
      where: { user_id: userId, status: 'OPEN' }
    })

    if (existing) {
      return res.status(400).json({ error: 'Ya tienes una caja abierta. Realiza un corte primero.' })
    }

    const session = await prisma.cashSession.create({
      data: {
        user_id: userId,
        opening_balance: Math.round(parseFloat(opening_balance) * 100) || 0,
        status: 'OPEN'
      }
    })

    res.json(session)
  } catch (error) {
    console.error('Error opening cash session:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const getCutData = async (req, res) => {
  const userId = req.user.id
  try {
    const session = await prisma.cashSession.findFirst({
      where: { user_id: userId, status: 'OPEN' }
    })

    if (!session) {
      return res.status(404).json({ error: 'No hay caja abierta.' })
    }

    const sales = await prisma.sale.findMany({
      where: {
        updated_at: { gte: session.opened_at },
        status: { in: ['PAID', 'LIQUIDADO', 'COBRADO_CHOFER', 'PAGADO'] }
      }
    })

    const customerPayments = await prisma.customerPayment.findMany({
      where: {
        created_at: { gte: session.opened_at },
        status: 'APPLIED'
      }
    })

    let cash = 0
    let card = 0
    let transfer = 0
    let other = 0

    const processAmount = (amount, method) => {
      const m = (method || '').toUpperCase()
      // Mapeo robusto de métodos de pago
      if (m === 'CASH' || m.includes('EFECT') || m.includes('CONTRA')) {
        cash += amount
      } else if (m === 'CARD' || m.includes('TARJETA') || m.includes('DEBIT') || m.includes('CREDIT')) {
        card += amount
      } else if (m === 'TRANSFER' || m.includes('TRANS')) {
        transfer += amount
      } else {
        other += amount
      }
    }

    sales.forEach(sale => {
      if (sale.payment_method === 'CREDIT_STORE') return
      const amount = sale.total_amount || 0
      const method = sale.collected_method || sale.payment_method
      processAmount(amount, method)
    })

    customerPayments.forEach(payment => {
      processAmount(payment.amount || 0, payment.payment_method)
    })

    const expectedCash = session.opening_balance + cash

    res.json({
      session,
      totals: {
        cash: cash / 100,
        card: card / 100,
        transfer: transfer / 100,
        other: other / 100,
        opening_balance: session.opening_balance / 100,
        expected_cash: expectedCash / 100
      }
    })
  } catch (error) {
    console.error('Error fetching cut data:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const closeSession = async (req, res) => {
  const userId = req.user.id
  const { closing_balance, expected_balance, notes } = req.body

  try {
    const session = await prisma.cashSession.findFirst({
      where: { user_id: userId, status: 'OPEN' }
    })

    if (!session) {
      return res.status(404).json({ error: 'No hay caja abierta.' })
    }

    const updated = await prisma.cashSession.update({
      where: { id: session.id },
      data: {
        status: 'CLOSED',
        closed_at: new Date(),
        closing_balance: Math.round(parseFloat(closing_balance) * 100),
        expected_balance: Math.round(parseFloat(expected_balance) * 100),
        notes: notes || ''
      }
    })

    res.json(updated)
  } catch (error) {
    console.error('Error closing cash session:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { getCurrentSession, openSession, getCutData, closeSession }
