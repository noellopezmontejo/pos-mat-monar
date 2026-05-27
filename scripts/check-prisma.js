const { prisma } = require('../src/api/db');

async function check() {
  console.log('--- PRISMA MODEL AUDIT ---');
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && typeof prisma[k] === 'object');
  console.log('Available Models:', models.join(', '));
  
  if (prisma.productBrand) {
    console.log('✅ productBrand is FOUND in the client.');
  } else {
    console.log('❌ productBrand is MISSING from the client.');
  }

  if (prisma.productLine) {
    console.log('✅ productLine is FOUND in the client.');
  } else {
    console.log('❌ productLine is MISSING from the client.');
  }
}

check();
