const express = require('express')
const router = express.Router()
const { getPendingPayments, validatePayment, addTransaction, getPaymentTransactions, revertValidation, cancelTransaction } = require('../controllers/cpController')

// GET /api/cp/payments - List all pending/validated supplier payments
router.get('/payments', getPendingPayments)

// PUT /api/cp/payments/:id/validate - Accounting Area validates and sets final amount
router.put('/payments/:id/validate', validatePayment)

// PUT /api/cp/payments/:id/revert-validation - Return to 'Por Validar' status
router.put('/payments/:id/revert-validation', revertValidation)

// POST /api/cp/payments/:id/transaction - Add a partial or total payment record
router.post('/payments/:id/transaction', addTransaction)

// DELETE /api/cp/transactions/:id - Cancel a payment transaction (id is transaction id)
router.delete('/transactions/:id', cancelTransaction)

// GET /api/cp/payments/:id/transactions - List payment history for a specific obligation
router.get('/payments/:id/transactions', getPaymentTransactions)

module.exports = router
