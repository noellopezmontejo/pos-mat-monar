const express = require('express')
const router = express.Router()
const { getCustomers, createCustomer, updateCustomer, searchCustomers } = require('../controllers/customerController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', getCustomers)
router.get('/search', searchCustomers)
router.post('/', authenticateToken, createCustomer)
router.put('/:id', authenticateToken, updateCustomer)

module.exports = router
