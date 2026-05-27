const express = require('express')
const router = express.Router()
const { getSuppliers, searchSuppliers, createSupplier } = require('../controllers/supplierController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', getSuppliers)
router.get('/search', searchSuppliers)
router.post('/', authenticateToken, createSupplier)

module.exports = router
