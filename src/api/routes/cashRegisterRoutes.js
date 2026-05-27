const express = require('express')
const router = express.Router()
const cashRegisterController = require('../controllers/cashRegisterController')
const { authenticateToken } = require('../middleware/auth')

router.get('/current', authenticateToken, cashRegisterController.getCurrentSession)
router.post('/open', authenticateToken, cashRegisterController.openSession)
router.get('/cut', authenticateToken, cashRegisterController.getCutData)
router.post('/close', authenticateToken, cashRegisterController.closeSession)

module.exports = router
