const express = require('express')
const router = express.Router()
const { createCashCut, getDailyReport } = require('../controllers/cashController')
const { authenticateToken } = require('../middleware/auth')

router.post('/cut', authenticateToken, createCashCut)
router.get('/report', authenticateToken, getDailyReport)

module.exports = router
