const express = require('express');
const router = express.Router();
const { 
  generateInvoice, 
  getInvoices, 
  cancelInvoice, 
  generateCreditNote 
} = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

// Todos los endpoints de facturación deben estar protegidos
router.use(authenticateToken);

router.post('/invoice', generateInvoice);
router.get('/', getInvoices);
router.post('/cancel', cancelInvoice);
router.post('/credit-note', generateCreditNote);

// Download placeholders
router.get('/download/:uuid/xml', (req, res) => res.send('XML File Content Mock'));
router.get('/download/:uuid/pdf', (req, res) => res.send('PDF File Content Mock'));

module.exports = router;
