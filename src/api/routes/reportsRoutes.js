const express = require('express')
const router = express.Router()
const reportsController = require('../controllers/reportsController')
const { authenticateToken } = require('../middleware/auth')

// All routes are protected
router.use(authenticateToken)

router.get('/products', reportsController.getProductsReport)
router.get('/inventory', reportsController.getInventoryReport)
router.get('/kardex', reportsController.getKardexReport)
router.get('/purchases', reportsController.getPurchasesReport)
router.get('/supplier-payments', reportsController.getSupplierPaymentsReport)
router.get('/accounts-payable', reportsController.getAccountsPayableReport)
router.get('/pos-sales', reportsController.getPosSalesReport)
router.get('/sales', reportsController.getSalesByStatusReport)
router.get('/cash-sessions', reportsController.getCashSessionsReport)
router.get('/customer-collections', reportsController.getCustomerCollectionsReport)
router.get('/accounts-receivable', reportsController.getAccountsReceivableReport)

module.exports = router
