const { prisma } = require('../db')

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(categories)
  } catch (error) {
    console.error('Error getCategories:', error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
}

const createCategory = async (req, res) => {
  const { name, description, legacy_code } = req.body
  try {
    const category = await prisma.category.create({
      data: { name, description, legacy_code }
    })
    res.json(category)
  } catch (error) {
    console.error('Error createCategory:', error)
    res.status(500).json({ error: 'Error al crear categoría' })
  }
}

module.exports = { getCategories, createCategory }
