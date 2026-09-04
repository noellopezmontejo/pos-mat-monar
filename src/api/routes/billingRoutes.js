const express = require('express');
const router = express.Router();
const { 
  generateInvoice, 
  getInvoices, 
  cancelInvoice, 
  generateCreditNote,
  downloadXML,
  downloadPDF
} = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

// Endpoints de descarga pública (no requieren cabecera Bearer)
router.get('/download/:uuid/xml', downloadXML);
router.get('/download/:uuid/pdf', downloadPDF);

// Todos los demás endpoints de facturación deben estar protegidos
router.use(authenticateToken);

router.post('/invoice', generateInvoice);
router.get('/', getInvoices);
router.post('/cancel', cancelInvoice);
router.post('/credit-note', generateCreditNote);

module.exports = router;
