const { prisma } = require('../db')

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { created_at: 'desc' },
      take: 10
    })
    res.json(suppliers)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proveedores' })
  }
}

const searchSuppliers = async (req, res) => {
  const { query } = req.query
  if (!query) return res.json([])

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { rfc: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { legacy_code: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20
    })
    res.json(suppliers)
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda de proveedores' })
  }
}

const createSupplier = async (req, res) => {
  const { name, rfc, phone, email, address, legacy_code } = req.body
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        rfc,
        phone,
        email,
        address,
        legacy_code
      }
    })
    res.json(supplier)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proveedor' })
  }
}

module.exports = { getSuppliers, searchSuppliers, createSupplier }
