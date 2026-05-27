const express = require('express')
const router = express.Router()
const {
  getTransfers,
  createTransfer,
  receiveTransfer,
  getConversions,
  convertProduct,
  getKits,
  createKitProduct,
  assembleKit,
  disassembleKit,
  getSupplierReturns,
  createSupplierReturn,
  getCustomerReturns,
  createCustomerReturn
} = require('../controllers/inventoryAdditionsController')
const { authenticateToken } = require('../middleware/auth')

router.use(authenticateToken)

// Traspasos
router.get('/transfers', getTransfers)
router.post('/transfers', createTransfer)
router.post('/transfers/:id/receive', receiveTransfer)

// Conversiones
router.get('/conversions', getConversions)
router.post('/conversions', convertProduct)

// Kits
router.get('/kits', getKits)
router.post('/kits', createKitProduct)
router.post('/kits/assemble', assembleKit)
router.post('/kits/disassemble', disassembleKit)

// Devoluciones Proveedores
router.get('/supplier-returns', getSupplierReturns)
router.post('/supplier-returns', createSupplierReturn)

// Devoluciones Clientes
router.get('/customer-returns', getCustomerReturns)
router.post('/customer-returns', createCustomerReturn)

module.exports = router
