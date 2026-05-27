const { prisma } = require('../db')
const bcrypt = require('bcryptjs')

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, driverId: true, created_at: true, driver: { select: { name: true } } },
      orderBy: { name: 'asc' }
    })
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

const createUser = async (req, res) => {
  const { username, password, name, role, driverId } = req.body
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, name, role, driverId, permissions: [] },
      select: { id: true, username: true, name: true, role: true, driverId: true }
    })
    res.status(201).json(user)
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'El nombre de usuario ya existe' })
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
}

const updateUser = async (req, res) => {
  const { id } = req.params
  const { name, role, password, driverId } = req.body
  try {
    const data = { name, role, driverId }
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, driverId: true }
    })
    res.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'Usuario eliminado' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
}

const getAlmacenistas = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'Almacenista' },
      select: { id: true, name: true, username: true, role: true },
      orderBy: { name: 'asc' }
    })
    
    if (users.length === 0) {
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, username: true, role: true },
        orderBy: { name: 'asc' }
      })
      return res.json(allUsers)
    }

    res.json(users)
  } catch (error) {
    console.error('Error fetching almacenistas:', error)
    res.status(500).json({ error: 'Error al obtener personal de almacén' })
  }
}

const getChoferes = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'Chofer' },
      select: { id: true, name: true, username: true, role: true },
      orderBy: { name: 'asc' }
    })
    res.json(users)
  } catch (error) {
    console.error('Error fetching choferes:', error)
    res.status(500).json({ error: 'Error al obtener personal de choferes' })
  }
}

module.exports = { getUsers, createUser, updateUser, deleteUser, getAlmacenistas, getChoferes }
