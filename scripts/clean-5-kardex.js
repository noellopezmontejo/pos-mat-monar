const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando Paso 5: Kardex...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Kardex" RESTART IDENTITY CASCADE;');
    console.log('✅ Movimientos de Inventario (Kardex) reseteados.');
  } catch (error) { console.error('❌ Error:', error); }
  finally { await prisma.$disconnect(); }
}
main();
