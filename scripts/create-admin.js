const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  const username = 'admin'
  const password = 'admin123'
  const name = 'Administrador Sistema'
  const role = 'Administrador'
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existing) {
      await prisma.user.update({
        where: { username },
        data: { password: hashedPassword, role }
      })
      console.log('Usuario admin actualizado con éxito.')
    } else {
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          role,
          permissions: []
        }
      })
      console.log('Usuario admin creado con éxito.')
    }
    
    console.log('-------------------------')
    console.log('Usuario:', username)
    console.log('Contraseña:', password)
    console.log('-------------------------')
    
  } catch (error) {
    console.error('Error al crear el administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
