const express = require('express')
const router = express.Router()
const { getDebtors, getStatement, registerPayment } = require('../controllers/collectionsController')
const { authenticateToken } = require('../middleware/auth')

router.get('/customers', authenticateToken, getDebtors)
router.get('/statement/:customerId', authenticateToken, getStatement)
router.post('/payment', authenticateToken, registerPayment)

module.exports = router
