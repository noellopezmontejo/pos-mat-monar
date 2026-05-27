const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const password = 'Monar2026!'
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.upsert({
      where: { username: 'nlopez' },
      update: {
        name: 'Noel Lopez',
        role: 'Almacenista',
        password: hashedPassword
      },
      create: {
        username: 'nlopez',
        name: 'Noel Lopez',
        password: hashedPassword,
        role: 'Almacenista',
        permissions: ['READ_PURCHASES', 'CREATE_RECEPTION', 'READ_INVENTORY']
      }
    })

    console.log('----------------------------------------')
    console.log('¡Usuario Noel Lopez (Almacenista) Creado!')
    console.log(`Username: ${user.username}`)
    console.log(`Password: ${password}`)
    console.log('----------------------------------------')
  } catch (error) {
    console.error('Error al crear usuario:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
