const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando Paso 2: Inventarios...');
  try {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Product", "Category", "Stock" RESTART IDENTITY CASCADE;');
    console.log('✅ Catálogo de Productos e Inventarios reseteado.');
  } catch (error) { console.error('❌ Error:', error); }
  finally { await prisma.$disconnect(); }
}
main();
