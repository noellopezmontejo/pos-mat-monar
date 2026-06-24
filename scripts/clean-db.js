const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🚀 Iniciando limpieza dinámica de base de datos...');

  try {
    // 1. Matar conexiones activas para evitar candados (locks)
    console.log('- Forzando cierre de otras conexiones abiertas (Matando candados)...');
    try {
      await prisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = current_database() 
        AND pid <> pg_backend_pid();
      `);
    } catch (e) {
      // Ignorar si no se puede matar alguna conexión
    }

    // Timeout corto de bloqueo para evitar quedarse colgado
    await prisma.$executeRawUnsafe(`SET lock_timeout = '10s';`);

    // 2. Romper referencias antes de borrar para mantener integridad referencial
    console.log('- Desvinculando referencias de choferes en la tabla de usuarios...');
    await prisma.$executeRawUnsafe(`UPDATE "User" SET "driverId" = NULL;`);

    // 3. Obtener dinámicamente todas las tablas en el esquema public
    console.log('- Obteniendo lista de tablas...');
    const result = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `);

    const allTables = result.map(row => row.tablename);

    // Listado de tablas a preservar (exclusiones)
    const excludeTables = [
      'User',
      'Branch',
      'CompanyProfile',
      'SatRegime',
      'SatCfdiUse',
      'GeoCountry',
      'GeoState',
      'GeoLocality',
      'c_colonia',
      'c_cp',
      'c_estado',
      'c_municipio',
      'c_pais',
      'catformapagosat',
      'catmetodopagosat',
      'catregimensat',
      'catusocfdisat',
      '_prisma_migrations'
    ];

    // Convertir a minúsculas para comparación robusta
    const excludeSet = new Set(excludeTables.map(t => t.toLowerCase()));

    // Filtrar las tablas que vamos a borrar y ponerles comillas dobles para SQL seguro
    const tablesToDelete = allTables
      .filter(t => !excludeSet.has(t.toLowerCase()))
      .map(t => `"${t}"`);

    if (tablesToDelete.length === 0) {
      console.log('✅ No hay tablas que requieran limpieza.');
      return;
    }

    console.log(`- Tablas identificadas para limpiar (${tablesToDelete.length}):`);
    console.log(tablesToDelete.join(', '));

    // 4. Activar modo réplica temporalmente para evitar restricciones de clave foránea al borrar
    console.log(`- Desactivando restricciones temporalmente (modo réplica)...`);
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    console.log(`- Borrando datos de las tablas...`);
    for (const table of tablesToDelete) {
      await prisma.$executeRawUnsafe(`DELETE FROM ${table};`);
    }

    // 5. Restaurar el rol de replicación a origin
    console.log(`- Restaurando restricciones (modo origen)...`);
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    console.log('✅ Base de datos reseteada exitosamente.');
    console.log('💡 Se conservaron los usuarios, roles, sucursales y catálogos estáticos sin referencias huérfanas.');
  } catch (error) {
    console.error('❌ Error durante la limpieza de la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();


