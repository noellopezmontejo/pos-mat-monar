const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const taxCount = await prisma.taxScheme.count();
  const prodCount = await prisma.product.count();
  const sampleTaxes = await prisma.taxScheme.findMany({ take: 5 });
  const sampleProds = await prisma.product.findMany({ 
    take: 5,
    include: { tax_scheme: true }
  });

  console.log('--- PG Stats ---');
  console.log('TaxSchemes:', taxCount);
  console.log('Products:', prodCount);
  console.log('Sample Tax Codes:', sampleTaxes.map(t => t.code));
  console.log('Sample Product Tax IDs:', sampleProds.map(p => p.tax_scheme_id));
  
  await prisma.$disconnect();
}
main();
