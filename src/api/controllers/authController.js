const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { prisma } = require('../db')

const login = async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await prisma.user.findUnique({ 
      where: { username },
      include: { driver: { include: { vehicle: true } } }
    })
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' })
  }
}

module.exports = { login }
