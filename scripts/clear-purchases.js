const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de datos de Compras...');
  
  try {
    // El orden importa debido a las relaciones (reception_id en PurchaseOrderItem si existiera, o items -> orders)
    const itemsDeleted = await prisma.purchaseOrderItem.deleteMany({});
    console.log(`✅ Se eliminaron ${itemsDeleted.count} partidas de compra.`);

    const receptionsDeleted = await prisma.reception.deleteMany({});
    console.log(`✅ Se eliminaron ${receptionsDeleted.count} recepciones.`);

    const ordersDeleted = await prisma.purchaseOrder.deleteMany({});
    console.log(`✅ Se eliminaron ${ordersDeleted.count} órdenes de compra.`);

    console.log('✨ Limpieza de Compras completada.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
