const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando Paso 4: Facturación...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Sale", "SaleItem", "Delivery", "CFDI" RESTART IDENTITY CASCADE;');
    console.log('✅ Histórico de Ventas y Facturación reseteado.');
  } catch (error) { console.error('❌ Error:', error); }
  finally { await prisma.$disconnect(); }
}
main();
