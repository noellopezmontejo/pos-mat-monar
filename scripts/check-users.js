const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, role: true }
  });
  console.log('--- Usuarios en la Base de Datos ---');
  console.table(users);
  console.log('-----------------------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
