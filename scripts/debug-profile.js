const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.companyProfile.findFirst();
  console.log('--- Configuración de Perfil ---');
  console.log(JSON.stringify(p, null, 2));
  console.log('-------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
