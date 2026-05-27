const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const regimes = await prisma.catRegimenSatNuevo.findMany();
    console.log('Regimes count:', regimes.length);
    const uses = await prisma.catUsoCfdiSatNuevo.findMany();
    console.log('Uses count:', uses.length);
    const cp = await prisma.cCp.findFirst({ where: { c_CP: '44100' } });
    console.log('CP:', cp);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
