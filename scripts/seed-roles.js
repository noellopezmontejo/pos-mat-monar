const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const password = 'Monar2026!'
  const hashedPassword = await bcrypt.hash(password, 10)

  const roles = [
    { username: 'admin', name: 'Administrador Sistema', role: 'Administrador' },
    { username: 'gerente', name: 'Gerente General', role: 'Gerente' },
    { username: 'mostrador', name: 'Vendedor de Mostrador', role: 'Vendedor Mostrador' },
    { username: 'cajero', name: 'Cajero Principal', role: 'Vendedor Cajero' },
    { username: 'facturista', name: 'Responsable Facturación', role: 'Facturista' },
    { username: 'almacen', name: 'Jefe de Almacén', role: 'Almacenista' },
    { username: 'contabilidad', name: 'Área Contable', role: 'Área Contable' }
  ]

  console.log('--- Iniciando Siembra de Roles ---')

  for (const r of roles) {
    try {
      const user = await prisma.user.upsert({
        where: { username: r.username },
        update: {
          name: r.name,
          role: r.role,
          password: hashedPassword
        },
        create: {
          username: r.username,
          name: r.name,
          password: hashedPassword,
          role: r.role,
          permissions: []
        }
      })
      console.log(`[OK] Usuario: ${user.username} | Rol: ${user.role}`)
    } catch (error) {
      console.error(`[ERROR] No se pudo crear ${r.username}:`, error.message)
    }
  }

  console.log('---------------------------------')
  console.log('Contraseña común: Monar2026!')
  console.log('---------------------------------')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
