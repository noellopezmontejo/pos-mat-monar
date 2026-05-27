const express = require('express')
const router = express.Router()
const taxSchemeController = require('../controllers/taxSchemeController')
const { authenticateToken } = require('../middleware/auth')

router.get('/', taxSchemeController.getTaxSchemes)
router.post('/', authenticateToken, taxSchemeController.createTaxScheme)

module.exports = router
