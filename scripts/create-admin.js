require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  let username = process.argv[2];
  let password = process.argv[3];
  let name = process.argv[4];

  // Interactive mode if arguments are missing
  if (!username || !password || !name) {
    console.log('\n==========================================');
    console.log('   GENERADOR DE USUARIO ADMINISTRADOR');
    console.log('==========================================');
    console.log('Deje en blanco para usar los valores por defecto.\n');

    if (!username) {
      username = await askQuestion('Nombre de usuario (default: admin): ');
      if (!username) username = 'admin';
    }

    if (!password) {
      password = await askQuestion('Contraseña (default: admin123): ');
      if (!password) password = 'admin123';
    }

    if (!name) {
      name = await askQuestion('Nombre completo (default: Administrador Sistema): ');
      if (!name) name = 'Administrador Sistema';
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      console.log(`\n⚠️  El usuario "${username}" ya existe con el rol "${existing.role}".`);
      const confirm = await askQuestion('¿Desea actualizar su contraseña y asegurar rol de Administrador? (s/n): ');
      if (confirm.toLowerCase() === 's' || confirm.toLowerCase() === 'si' || confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        await prisma.user.update({
          where: { username },
          data: { 
            password: hashedPassword, 
            role: 'Administrador',
            name: name
          }
        });
        console.log('✅ Usuario actualizado con éxito.');
      } else {
        console.log('❌ Operación cancelada.');
        return;
      }
    } else {
      await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          role: 'Administrador',
          permissions: []
        }
      });
      console.log('✅ Usuario administrador creado con éxito.');
    }

    console.log('\n----------------------------------------');
    console.log('Resumen de credenciales:');
    console.log('  Usuario:    ', username);
    console.log('  Nombre:     ', name);
    console.log('  Contraseña: ', password);
    console.log('  Rol:        ', 'Administrador');
    console.log('----------------------------------------\n');

  } catch (error) {
    console.error('❌ Error al procesar el usuario administrador:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
