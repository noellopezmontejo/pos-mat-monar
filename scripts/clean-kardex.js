const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    const deleted = await prisma.kardex.deleteMany({
      where: {
        branch_id: null
      }
    });
    console.log(`Eliminados ${deleted.count} registros del Kardex sin relación de Almacén.`);
  } catch (error) {
    console.error('Error al limpiar el Kardex:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
