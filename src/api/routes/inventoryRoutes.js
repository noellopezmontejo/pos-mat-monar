const express = require('express')
const router = express.Router()
const { adjustStock, transferStock, getInventorySearch } = require('../controllers/inventoryController')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)

router.get('/search', getInventorySearch)
router.post('/adjust', adjustStock)
router.post('/transfer', transferStock)

module.exports = router
