const express = require('express')
const router = express.Router()
const {
  getRoutes, getPendingDeliveries, createRoute, updateDeliveryStatus,
  analyzeDeliveries, assignToRoute, getDriverRoutes, getActiveDrivers,
  optimizeRouteOrder, getMapsUrl,
  updateRouteLocation, getRouteTracking, toggleTracking,
  retryDelivery, getPendingLiquidation, liquidateSale
} = require('../controllers/logisticsController')
const { authenticateToken } = require('../middleware/auth')

router.get('/routes', authenticateToken, getRoutes)
router.get('/deliveries/pending', authenticateToken, getPendingDeliveries)
router.post('/routes', authenticateToken, createRoute)
router.post('/routes/:id/assign', authenticateToken, assignToRoute)
router.post('/routes/:id/optimize', authenticateToken, optimizeRouteOrder)
router.get('/routes/:id/maps-url', authenticateToken, getMapsUrl)
router.patch('/delivery/:id', authenticateToken, updateDeliveryStatus)
router.patch('/delivery/:id/retry', authenticateToken, retryDelivery)
router.post('/analyze', authenticateToken, analyzeDeliveries)

// Live tracking
router.patch('/routes/:id/location', authenticateToken, updateRouteLocation)
router.get('/routes/:id/tracking', authenticateToken, getRouteTracking)
router.patch('/routes/:id/tracking-toggle', authenticateToken, toggleTracking)

// Driver PWA endpoints
router.get('/drivers/active', authenticateToken, getActiveDrivers)
router.get('/driver/:driverId/routes', authenticateToken, getDriverRoutes)

// Liquidación de cobranza de chofer
router.get('/pending-liquidation', authenticateToken, getPendingLiquidation)
router.post('/liquidate/:saleId', authenticateToken, liquidateSale)

module.exports = router
