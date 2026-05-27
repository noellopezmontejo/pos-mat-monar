const express = require('express')
const router = express.Router()
const { getPurchaseOrders, getReceptions, createReception, searchPurchaseOrders, searchReceptions, createPurchaseOrder, getReceptionDetail, cancelReception, cancelPurchaseOrder, updatePurchaseOrder } = require('../controllers/purchaseController')
const { authenticateToken } = require('../middleware/auth')

router.get('/orders', getPurchaseOrders)
router.post('/orders', createPurchaseOrder)
router.put('/orders/:id', updatePurchaseOrder)
router.get('/orders/search', searchPurchaseOrders)
router.delete('/orders/:id', cancelPurchaseOrder)
router.get('/receptions', getReceptions)
router.get('/receptions/search', searchReceptions)
router.get('/receptions/:id', getReceptionDetail)
router.delete('/receptions/:id', cancelReception)
router.post('/receptions', createReception)

module.exports = router
