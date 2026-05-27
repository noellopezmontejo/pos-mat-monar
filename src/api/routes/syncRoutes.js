const express = require('express')
const router = express.Router()
const { syncFromPWA } = require('../controllers/syncController')
const { authenticateToken } = require('../middleware/auth')

router.post('/', authenticateToken, syncFromPWA)

module.exports = router
