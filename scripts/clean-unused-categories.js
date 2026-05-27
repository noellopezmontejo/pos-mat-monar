const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanUnused() {
  try {
    console.log('--- INICIANDO LIMPIEZA DE CATEGORÍAS SIN PRODUCTOS ---');

    // 1. Marcas sin relación con productos
    const unusedBrands = await prisma.productBrand.deleteMany({
      where: {
        products: {
          none: {}
        }
      }
    });
    console.log(`✅ Marcas (fabricantes) eliminadas por no tener uso: ${unusedBrands.count}`);

    // 2. Líneas sin relación con productos
    const unusedLines = await prisma.productLine.deleteMany({
      where: {
        products: {
          none: {}
        }
      }
    });
    console.log(`✅ Líneas (departamentos) eliminadas por no tener uso: ${unusedLines.count}`);

    // 3. Categorías (familias) sin relación con productos
    const unusedCats = await prisma.category.deleteMany({
      where: {
        products: {
          none: {}
        }
      }
    });
    console.log(`✅ Familias (categorías) eliminadas por no tener uso: ${unusedCats.count}`);

  } catch (e) {
    console.error('❌ Error durante la limpieza inteligente:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

cleanUnused();
