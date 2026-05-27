const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🚀 Iniciando TRUNCATE unificado de alto rendimiento...');

  const tables = [
    '"AuditLog"', '"Kardex"', '"Reception"', '"Delivery"', '"SaleItem"', '"PurchaseOrderItem"',
    '"Sale"', '"PurchaseOrder"', '"Credit"', '"CFDI"', '"Stock"', '"Product"', '"Category"',
    '"Customer"', '"Supplier"', '"FiscalClient"', '"CashShift"'
  ];

  try {
    console.log('- Forzando cierre de otras conexiones abiertas (Matando candados)...');
    try {
      await prisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND pid <> pg_backend_pid();
      `);
    } catch (e) {
      // Ignore if some don't die
    }

    // Establecer un timeout corto para que no se quede colgado si hay un candado
    await prisma.$executeRawUnsafe(`SET lock_timeout = '10s';`);
    
    console.log(`- Truncando todas las tablas simultáneamente...`);
    const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
    await prisma.$executeRawUnsafe(truncateQuery);

    console.log('✅ Base de datos reseteada instantáneamente.');
    console.log('💡 Los usuarios, sucursales y la estructura se mantienen.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
