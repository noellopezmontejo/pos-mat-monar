const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando Paso 3: Compras...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "PurchaseOrder", "PurchaseOrderItem", "Reception" RESTART IDENTITY CASCADE;');
    console.log('✅ Histórico de Compras y Recepciones reseteado.');
  } catch (error) { console.error('❌ Error:', error); }
  finally { await prisma.$disconnect(); }
}
main();
