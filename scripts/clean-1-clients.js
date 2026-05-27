const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando Paso 1: Clientes y Proveedores...');
  try {
    // Truncate para manejar dependencias circulares si las hubiera
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Customer", "Supplier", "FiscalClient", "Credit" RESTART IDENTITY CASCADE;');
    console.log('✅ Catálogos de Clientes y Proveedores reseteados.');
  } catch (error) { console.error('❌ Error:', error); }
  finally { await prisma.$disconnect(); }
}
main();
