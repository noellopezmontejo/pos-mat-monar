const { prisma } = require('../db')

const createCashCut = async (req, res) => {
  const { user_id, branch_id, initial_cash, final_cash } = req.body
  try {
    const cut = await prisma.cashShift.create({
      data: {
        user_id,
        branch_id,
        initial_cash: parseInt(initial_cash),
        final_cash: parseInt(final_cash),
        end_at: new Date()
      }
    })
    res.json(cut)
  } catch (error) {
    res.status(500).json({ error: 'Error al realizar el corte de caja' })
  }
}

const getDailyReport = async (req, res) => {
  // Logic to aggregate sales by payment method for the current shift
  res.json({ message: 'Reporte de hoy en construcción' })
}

module.exports = { createCashCut, getDailyReport }
