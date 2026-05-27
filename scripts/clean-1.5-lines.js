const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.productLine.deleteMany({})
  console.log('✅ Catálogo de Líneas (CLIN01) reseteado.')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
