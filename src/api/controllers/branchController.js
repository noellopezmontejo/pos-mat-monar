const { prisma } = require('../db')

const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(branches)
  } catch (error) {
    console.error('Error fetching branches:', error)
    res.status(500).json({ error: 'Error al obtener almacenes' })
  }
}

const createBranch = async (req, res) => {
  const { name, address } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre del almacén es obligatorio' })
  
  try {
    const branch = await prisma.branch.create({
      data: { name, address }
    })
    res.json(branch)
  } catch (error) {
    console.error('Error creating branch:', error)
    res.status(500).json({ error: 'Error al crear el almacén' })
  }
}

const updateBranch = async (req, res) => {
  const { id } = req.params
  const { name, address } = req.body
  
  try {
    const branch = await prisma.branch.update({
      where: { id },
      data: { name, address }
    })
    res.json(branch)
  } catch (error) {
    console.error('Error updating branch:', error)
    res.status(500).json({ error: 'Error al actualizar el almacén' })
  }
}

const deleteBranch = async (req, res) => {
  const { id } = req.params
  try {
    // Verificar si hay stock o movimientos asociados
    const stockCount = await prisma.stock.count({ where: { branch_id: id } })
    const kardexCount = await prisma.kardex.count({ where: { branch_id: id } })
    
    if (stockCount > 0 || kardexCount > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar un almacén que tiene inventario o movimientos registrados.' 
      })
    }
    
    await prisma.branch.delete({ where: { id } })
    res.json({ message: 'Almacén eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting branch:', error)
    res.status(500).json({ error: 'Error al eliminar el almacén' })
  }
}

module.exports = { getBranches, createBranch, updateBranch, deleteBranch }
