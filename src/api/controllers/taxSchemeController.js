const { prisma } = require('../db')

const getTaxSchemes = async (req, res) => {
  try {
    const schemes = await prisma.taxScheme.findMany({
      orderBy: { code: 'asc' }
    })
    res.json(schemes)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener esquemas de impuestos' })
  }
}

const createTaxScheme = async (req, res) => {
  const { code, name, tax1_rate, tax1_apply, tax2_rate, tax2_apply, tax3_rate, tax3_apply, tax4_rate, tax4_apply, coi_account, num_reg } = req.body
  try {
    const scheme = await prisma.taxScheme.create({
      data: {
        code,
        name,
        tax1_rate: parseFloat(tax1_rate) || 0,
        tax1_apply: parseInt(tax1_apply) || 0,
        tax2_rate: parseFloat(tax2_rate) || 0,
        tax2_apply: parseInt(tax2_apply) || 0,
        tax3_rate: parseFloat(tax3_rate) || 0,
        tax3_apply: parseInt(tax3_apply) || 0,
        tax4_rate: parseFloat(tax4_rate) || 0,
        tax4_apply: parseInt(tax4_apply) || 0,
        coi_account,
        num_reg: parseInt(num_reg) || null
      }
    })
    res.json(scheme)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear esquema' })
  }
}

module.exports = { getTaxSchemes, createTaxScheme }
