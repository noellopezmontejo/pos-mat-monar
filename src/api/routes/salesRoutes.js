const express = require('express')
const router = express.Router()
const { createSale, getSales } = require('../controllers/salesController')
const { authenticateToken } = require('../middleware/auth')

router.post('/', authenticateToken, createSale)
router.get('/', authenticateToken, getSales)

module.exports = router
