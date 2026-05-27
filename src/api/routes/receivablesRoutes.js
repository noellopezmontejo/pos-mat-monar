const express = require('express')
const router = express.Router()
const { getReceivables, recordPayment, cancelSale, bulkCancel, bulkPayment } = require('../controllers/receivablesController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', authenticateToken, getReceivables)
router.post('/payment', authenticateToken, recordPayment)
router.post('/cancel', authenticateToken, cancelSale)
router.post('/bulk-cancel', authenticateToken, bulkCancel)
router.post('/bulk-payment', authenticateToken, bulkPayment)

module.exports = router
