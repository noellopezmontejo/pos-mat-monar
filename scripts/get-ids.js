const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pc = await prisma.customer.findFirst({ where: { name: 'Público General' } });
  const br = await prisma.branch.findFirst();
  console.log('--- IDS ENCONTRADOS ---');
  console.log('PC_ID:', pc ? pc.id : 'NO ENCONTRADO');
  console.log('BR_ID:', br ? br.id : 'NO ENCONTRADO');
}

main().finally(() => prisma.$disconnect());
