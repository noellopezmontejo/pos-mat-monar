const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.sale.count();
  console.log('Total de ventas en BD:', count);
  
  const sales = await prisma.sale.findMany({
    take: 10,
    orderBy: { created_at: 'desc' },
    include: {
      customer: true,
      items: true
    }
  });
  
  console.log('--- Últimas 10 Ventas ---');
  sales.forEach(s => {
    console.log(`ID: ${s.id} | Folio: ${s.folio} | Cliente: ${s.customer?.name} | Total: ${s.total_amount} | Status: ${s.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
