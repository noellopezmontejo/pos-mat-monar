const { prisma } = require('../db')

const getLines = async (req, res) => {
  try {
    const lines = await prisma.productLine.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(lines)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener líneas' })
  }
}

module.exports = { getLines }
