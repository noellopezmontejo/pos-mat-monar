const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Check for Publico General customer
    let publicCustomer = await prisma.customer.findFirst({
      where: { name: { contains: 'Publico', mode: 'insensitive' } }
    });

    if (!publicCustomer) {
      publicCustomer = await prisma.customer.create({
        data: {
          name: 'Público General',
          legacy_code: '0',
          customer_type: 'P1'
        }
      });
      console.log('Cliente "Público General" creado.');
    } else {
      console.log('Cliente "Público General" ya existe.');
    }

    // 2. Get first Branch (Warehouse)
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Matriz Principal',
          address: 'Conocido'
        }
      });
      console.log('Sucursal principal creada.');
    } else {
      console.log('Sucursal ya existe.');
    }

    console.log('SYSTEM_READY_FOR_POS');
    console.log(JSON.stringify({
      public_customer_id: publicCustomer.id,
      branch_id: branch.id
    }, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
