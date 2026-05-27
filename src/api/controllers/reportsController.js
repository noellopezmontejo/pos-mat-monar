const { prisma } = require('../db')

/**
 * Controller for generating various business reports.
 */

// Helper to parse dates
const getDateFilter = (from, to) => {
  if (!from && !to) return {}
  const filter = {}
  if (from) filter.gte = new Date(from)
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    filter.lte = toDate
  }
  return filter
}

const getProductsReport = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true
      },
      orderBy: { name: 'asc' }
    })

    const summary = {
      total: products.length,
      active: products.filter(p => p.status === 'ACTIVE' || p.status === 'Activo').length,
      services: products.filter(p => p.is_service === true).length
    }

    res.json({ data: products, summary })
  } catch (error) {
    console.error('getProductsReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de productos' })
  }
}

const getInventoryReport = async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        product: {
          include: { category: true }
        },
        branch: true
      },
      orderBy: { product: { name: 'asc' } }
    })

    // Calculate valuation (simplistic: quantity * cost)
    // Product.cost is in CENTS (Int)
    const valuationCents = stocks.reduce((acc, s) => acc + (s.quantity * (s.product?.cost || 0)), 0)

    const summary = {
      totalItems: stocks.length,
      totalUnits: stocks.reduce((acc, s) => acc + s.quantity, 0),
      totalValuation: valuationCents / 100, 
      lowStock: stocks.filter(s => s.quantity <= (s.product?.min_stock || 0)).length
    }

    res.json({ data: stocks, summary })
  } catch (error) {
    console.error('getInventoryReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de inventario' })
  }
}

const getKardexReport = async (req, res) => {
  const { from, to, product_id, branch_id } = req.query
  try {
    const where = {
      created_at: getDateFilter(from, to)
    }
    if (product_id) where.product_id = product_id
    if (branch_id) where.branch_id = branch_id

    const kardex = await prisma.kardex.findMany({
      where,
      include: {
        product: true,
        branch: true,
        user: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      entries: kardex.filter(k => k.type === 'IN').reduce((acc, k) => acc + k.quantity, 0),
      exits: kardex.filter(k => k.type === 'OUT').reduce((acc, k) => acc + k.quantity, 0)
    }

    res.json({ data: kardex, summary })
  } catch (error) {
    console.error('getKardexReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de kardex' })
  }
}

const getPurchasesReport = async (req, res) => {
  const { from, to, status } = req.query
  try {
    const where = {
      created_at: getDateFilter(from, to)
    }
    if (status) where.status = status

    const purchases = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        user: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      totalOrders: purchases.length,
      totalAmount: purchases.reduce((acc, p) => acc + (p.total_amount || 0), 0),
      pending: purchases.filter(p => p.status === 'Pendiente').length,
      received: purchases.filter(p => p.status === 'Recibido').length
    }

    res.json({ data: purchases, summary })
  } catch (error) {
    console.error('getPurchasesReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de compras' })
  }
}

const getSupplierPaymentsReport = async (req, res) => {
  const { from, to } = req.query
  try {
    const where = {
      created_at: getDateFilter(from, to),
      status: 'Activo'
    }

    const transactions = await prisma.supplierPaymentTransaction.findMany({
      where,
      include: {
        payment: {
          include: { supplier: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      totalPaid: transactions.reduce((acc, t) => acc + t.amount, 0), // amount is Float (dollars)
      byMethod: transactions.reduce((acc, t) => {
        const method = t.payment_method || 'Otros'
        acc[method] = (acc[method] || 0) + t.amount
        return acc
      }, {})
    }

    res.json({ data: transactions, summary })
  } catch (error) {
    console.error('getSupplierPaymentsReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de pagos' })
  }
}

const getAccountsPayableReport = async (req, res) => {
  try {
    const ap = await prisma.supplierPayment.findMany({
      where: {
        status: { not: 'Cancelado' },
        balance: { gt: 0 }
      },
      include: { supplier: true },
      orderBy: { due_date: 'asc' }
    })

    const summary = {
      totalDebt: ap.reduce((acc, p) => acc + p.balance, 0),
      overdue: ap.filter(p => p.due_date < new Date()).length
    }

    res.json({ data: ap, summary })
  } catch (error) {
    console.error('getAccountsPayableReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de CxP' })
  }
}

const getPosSalesReport = async (req, res) => {
  const { from, to } = req.query
  try {
    const where = {
      created_at: getDateFilter(from, to),
      type: 'DIRECT',
      status: { in: ['PAID', 'LIQUIDADO'] }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      totalSales: sales.length,
      totalAmount: sales.reduce((acc, s) => acc + (s.total_amount || 0), 0) / 100,
      avgTicket: sales.length > 0 ? (sales.reduce((acc, s) => acc + (s.total_amount || 0), 0) / 100 / sales.length) : 0
    }

    res.json({ data: sales, summary })
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte POS' })
  }
}

const getSalesByStatusReport = async (req, res) => {
  const { from, to, type, status } = req.query
  try {
    const where = {
      created_at: getDateFilter(from, to)
    }
    if (type) where.type = type
    if (status) where.status = status

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        user: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      total: sales.length,
      amount: sales.reduce((acc, s) => acc + (s.total_amount || 0), 0),
      paid: sales.filter(s => s.status === 'PAID').length,
      pending: sales.filter(s => s.status === 'PENDING').length
    }

    res.json({ data: sales, summary })
  } catch (error) {
    console.error('getSalesByStatusReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de ventas' })
  }
}

const getCashSessionsReport = async (req, res) => {
  const { from, to } = req.query
  try {
    const sessions = await prisma.cashSession.findMany({
      where: {
        opened_at: getDateFilter(from, to)
      },
      include: { user: { select: { name: true } } },
      orderBy: { opened_at: 'desc' }
    })

    const summary = {
      totalCuts: sessions.length,
      // expected_balance and closing_balance are INTS (Cents)
      totalDifference: sessions.reduce((acc, s) => acc + ((s.closing_balance || 0) - (s.expected_balance || 0)), 0) / 100
    }

    res.json({ data: sessions, summary })
  } catch (error) {
    console.error('getCashSessionsReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de cajas' })
  }
}

const getCustomerCollectionsReport = async (req, res) => {
  const { from, to } = req.query
  try {
    const payments = await prisma.customerPayment.findMany({
      where: {
        created_at: getDateFilter(from, to)
      },
      include: {
        customer: true,
        sale: { select: { folio: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const summary = {
      totalRecovered: payments.reduce((acc, p) => acc + (p.amount || 0), 0), // amount is Float (dollars)
      byMethod: payments.reduce((acc, p) => {
        const method = p.payment_method || 'Otros'
        acc[method] = (acc[method] || 0) + (p.amount || 0)
        return acc
      }, {})
    }

    res.json({ data: payments, summary })
  } catch (error) {
    console.error('getCustomerCollectionsReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de cobranza' })
  }
}

const getAccountsReceivableReport = async (req, res) => {
  try {
    const ar = await prisma.sale.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        balance: { gt: 0 }
      },
      include: { customer: true },
      orderBy: { created_at: 'asc' }
    })

    const summary = {
      totalReceivable: ar.reduce((acc, s) => acc + (s.balance || 0), 0), // balance is Float (dollars)
      clientsCount: new Set(ar.map(s => s.customer_id)).size
    }

    res.json({ data: ar, summary })
  } catch (error) {
    console.error('getAccountsReceivableReport Error:', error)
    res.status(500).json({ error: 'Error al generar reporte de CxC' })
  }
}

module.exports = {
  getProductsReport,
  getInventoryReport,
  getKardexReport,
  getPurchasesReport,
  getSupplierPaymentsReport,
  getAccountsPayableReport,
  getPosSalesReport,
  getSalesByStatusReport,
  getCashSessionsReport,
  getCustomerCollectionsReport,
  getAccountsReceivableReport
}
