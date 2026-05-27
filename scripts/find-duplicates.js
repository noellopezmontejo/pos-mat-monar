const { prisma } = require('../src/api/db');

async function findDuplicates() {
  console.log('Searching for duplicates in Product table...');
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, barcode: true, legacy_code: true }
    });

    const barcodes = {};
    const legacyCodes = {};

    products.forEach(p => {
      if (p.barcode !== null && p.barcode !== undefined) {
        if (!barcodes[p.barcode]) barcodes[p.barcode] = [];
        barcodes[p.barcode].push(p.id);
      }
      if (p.legacy_code !== null && p.legacy_code !== undefined) {
        if (!legacyCodes[p.legacy_code]) legacyCodes[p.legacy_code] = [];
        legacyCodes[p.legacy_code].push(p.id);
      }
    });

    console.log('--- BARCODE DUPLICATES ---');
    for (const [code, ids] of Object.entries(barcodes)) {
      if (ids.length > 1) {
        console.log(`Barcode "${code}": ${ids.length} products found.`);
        ids.slice(0, 3).forEach(id => {
            const prod = products.find(px => px.id === id);
            console.log(`  - ID: ${id}, Name: ${prod.name}`);
        });
      }
    }

    console.log('\n--- LEGACY_CODE DUPLICATES ---');
    for (const [code, ids] of Object.entries(legacyCodes)) {
      if (ids.length > 1) {
        console.log(`Legacy Code "${code}": ${ids.length} products found.`);
      }
    }

  } catch (error) {
    console.error('Error finding duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicates();
