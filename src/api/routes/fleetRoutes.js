const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const {
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getDrivers, createDriver, updateDriver, deleteDriver
} = require('../controllers/fleetController')

// Vehicles
router.get('/vehicles',          authenticateToken, getVehicles)
router.post('/vehicles',         authenticateToken, createVehicle)
router.put('/vehicles/:id',      authenticateToken, updateVehicle)
router.delete('/vehicles/:id',   authenticateToken, deleteVehicle)

// Drivers
router.get('/drivers',           authenticateToken, getDrivers)
router.post('/drivers',          authenticateToken, createDriver)
router.put('/drivers/:id',       authenticateToken, updateDriver)
router.delete('/drivers/:id',    authenticateToken, deleteDriver)

module.exports = router
