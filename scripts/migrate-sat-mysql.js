const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================
// CONFIGURACIÓN DE CONEXIÓN MYSQL
// Cambia esto por las credenciales de tu DB de MySQL
// ============================================
const MYSQL_CONFIG = {
  host: 'localhost', // ip del servidor mysql
  user: 'root',      // tu usuario
  password: 'password_aqui', // tu contraseña
  database: 'nombre_de_tu_bd', // el nombre de la BD donde están los catálogos
};

async function main() {
  console.log('Iniciando migración de Catálogos SAT y GEO...');
  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Conectado exitosamente a la base de datos MySQL.');

    // ----------------------------------------------------
    // 1. MIGRACIÓN DEL RÉGIMEN FISCAL (Ejemplo)
    // ----------------------------------------------------
    console.log('\n[1] Migrando Régimen Fiscal...');
    // TODO: REEMPLAZA "tabla_regimen_fiscal" con tu nombre real de tabla en MySQL
    const [regimenes] = await connection.execute('SELECT * FROM tabla_regimen_fiscal');
    for (const row of regimenes) {
      await prisma.satRegime.upsert({
        where: { code: row.codigo_regimen }, // Reemplaza con tu nombre de columna (ej. 'clave', 'codigo', 'c_RegimenFiscal')
        update: {
          description: row.descripcion, // Reemplaza con tu nombre de columna
          applies_to: 'ALL'
        },
        create: {
          code: row.codigo_regimen,
          description: row.descripcion,
          applies_to: 'ALL'
        }
      });
    }
    console.log(`✅ ${regimenes.length} regímenes fiscales migrados.`);

    // ----------------------------------------------------
    // 2. MIGRACIÓN DEL USO CFDI
    // ----------------------------------------------------
    console.log('\n[2] Migrando Uso de CFDI...');
    const [usos] = await connection.execute('SELECT * FROM tabla_uso_cfdi');
    for (const row of usos) {
      await prisma.satCfdiUse.upsert({
        where: { code: row.codigo_uso }, 
        update: { description: row.descripcion },
        create: {
          code: row.codigo_uso,
          description: row.descripcion
        }
      });
    }
    console.log(`✅ ${usos.length} usos de CFDI migrados.`);

    // ----------------------------------------------------
    // 3. MIGRACIÓN DE PAÍSES, ESTADOS Y CÓDIGOS POSTALES
    // ----------------------------------------------------
    console.log('\n[3] Migrando Catálogos Geográficos...');
    
    // a. País
    const [paises] = await connection.execute('SELECT * FROM tabla_paises');
    for (const row of paises) {
      await prisma.geoCountry.upsert({
        where: { code: row.codigo_pais }, 
        update: { name: row.nombre },
        create: {
          code: row.codigo_pais,
          name: row.nombre
        }
      });
    }

    // b. Estados
    const [estados] = await connection.execute('SELECT * FROM tabla_estados');
    for (const row of estados) {
      // Nota: Asumiendo que obtienes el id del pais recien creado (ej, 'MEX')
      const country = await prisma.geoCountry.findUnique({ where: { code: 'MEX' } });
      if (country) {
          await prisma.geoState.create({
              data: {
                  code: row.codigo_estado,
                  name: row.nombre,
                  country_id: country.id
              }
          });
      }
    }

    // c. Localidades / Códigos Postales
    // ¡CUIDADO! Si son 145,000 registros, Prisma.createMany es MUCHO más rápido
    /*
    const [cpData] = await connection.execute('SELECT * FROM codigos_postales');
    const baches = cpData.map(row => ({
       zip_code: row.cp,
       settlement: row.colonia,
       type: row.tipo_asentamiento,
       municipality: row.municipio,
       // necesitas vincularlo al state_id internamente
       state_id: 'reemplazar-uuid-aqui' 
    }));
    await prisma.geoLocality.createMany({ data: baches, skipDuplicates: true });
    */
   
    console.log('✅ Migración de Catálogos Geográficos completada.');

  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
    await prisma.$disconnect();
  }
}

main();
