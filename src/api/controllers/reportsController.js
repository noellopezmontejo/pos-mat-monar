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

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const endOfYesterday = new Date(endOfToday)
    endOfYesterday.setDate(endOfYesterday.getDate() - 1)

    // 1. Sales of the Day vs Yesterday (amounts in cents divided by 100 for display)
    const todaySales = await prisma.sale.aggregate({
      where: {
        created_at: { gte: startOfToday, lte: endOfToday },
        status: { not: 'CANCELLED' }
      },
      _sum: { total_amount: true }
    })
    const todaySalesAmount = (todaySales._sum.total_amount || 0) / 100

    const yesterdaySales = await prisma.sale.aggregate({
      where: {
        created_at: { gte: startOfYesterday, lte: endOfYesterday },
        status: { not: 'CANCELLED' }
      },
      _sum: { total_amount: true }
    })
    const yesterdaySalesAmount = (yesterdaySales._sum.total_amount || 0) / 100

    let salesTrend = 0
    if (yesterdaySalesAmount > 0) {
      salesTrend = parseFloat((((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100).toFixed(1))
    } else if (todaySalesAmount > 0) {
      salesTrend = 100.0
    }

    // 2. New Customers (created today vs yesterday)
    const todayCustomers = await prisma.customer.count({
      where: {
        created_at: { gte: startOfToday, lte: endOfToday },
        deleted_at: null
      }
    })
    const yesterdayCustomers = await prisma.customer.count({
      where: {
        created_at: { gte: startOfYesterday, lte: endOfYesterday },
        deleted_at: null
      }
    })
    const totalCustomers = await prisma.customer.count({
      where: { deleted_at: null }
    })

    let customersTrend = 0
    if (yesterdayCustomers > 0) {
      customersTrend = parseFloat((((todayCustomers - yesterdayCustomers) / yesterdayCustomers) * 100).toFixed(1))
    } else if (todayCustomers > 0) {
      customersTrend = 100.0
    }

    // 3. Low Stock count (using raw PostgreSQL query for speed)
    const lowStockRaw = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Product" p
      WHERE p.status = 'Activo' AND p.is_service = false AND p.deleted_at IS NULL
      AND (
        SELECT COALESCE(SUM(s.quantity), 0) FROM "Stock" s WHERE s.product_id = p.id
      ) <= p.min_stock
    `
    const lowStockCount = lowStockRaw[0]?.count || 0

    // 4. Pending Advances & Pending Collections
    const pendingAdvances = await prisma.sale.count({
      where: {
        type: 'ADVANCE',
        status: { in: ['PENDING', 'PENDIENTE'] }
      }
    })

    const pendingCollections = await prisma.sale.count({
      where: {
        status: { in: ['PENDING', 'PENDIENTE', 'PENDIENTE_COBRO', 'COBRADO_CHOFER'] }
      }
    })

    // 5. Critical Alerts: top 5 products with stock below min_stock
    const criticalStockItems = await prisma.$queryRaw`
      SELECT p.id, p.name, p.min_stock, COALESCE(SUM(s.quantity), 0)::int as total_stock
      FROM "Product" p
      LEFT JOIN "Stock" s ON s.product_id = p.id
      WHERE p.status = 'Activo' AND p.is_service = false AND p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.min_stock
      HAVING COALESCE(SUM(s.quantity), 0) <= p.min_stock
      ORDER BY COALESCE(SUM(s.quantity), 0) ASC, p.min_stock DESC
      LIMIT 5
    `

    // 6. Weekly Sales Performance (last 7 days including today)
    const sevenDaysAgo = new Date(startOfToday)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const weeklySalesRaw = await prisma.sale.findMany({
      where: {
        created_at: { gte: sevenDaysAgo },
        status: { not: 'CANCELLED' }
      },
      select: {
        created_at: true,
        total_amount: true
      }
    })

    const formatLocalDate = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const weeklySales = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      
      const dateStr = formatLocalDate(d)
      const daySales = weeklySalesRaw.filter(sale => {
        return formatLocalDate(sale.created_at) === dateStr
      })
      
      const dayAmount = daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0)

      weeklySales.push({
        date: dateStr,
        dayName: daysOfWeek[d.getDay()],
        amount: dayAmount / 100
      })
    }

    res.json({
      salesToday: todaySalesAmount,
      salesTodayTrend: salesTrend,
      newCustomersToday: todayCustomers,
      newCustomersTrend: customersTrend,
      totalCustomers,
      lowStockCount,
      pendingAdvances,
      pendingCollections,
      criticalStockItems,
      weeklySales
    })
  } catch (error) {
    console.error('getDashboardStats Error:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' })
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
  getAccountsReceivableReport,
  getDashboardStats
}
