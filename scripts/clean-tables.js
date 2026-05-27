const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const table = process.argv[2];

if (!table) {
  console.error('Error: Debes especificar el nombre de la tabla (ej. Product).');
  process.exit(1);
}

async function clean() {
  try {
    console.log(`--- LIMPIANDO TABLA: ${table} ---`);
    // Usamos $executeRawUnsafe para truncar con CASCADE (importante para llaves foráneas)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    console.log(`✅ Tabla "${table}" vaciada exitosamente.`);
  } catch (e) {
    console.error(`❌ Error al limpiar la tabla ${table}:`, e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

clean();
