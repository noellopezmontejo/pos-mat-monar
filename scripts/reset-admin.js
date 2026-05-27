const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = 'Monar2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      role: 'Administrador',
      deleted_at: null
    },
    create: {
      username: 'admin',
      name: 'Administrador Sistema',
      password: hashedPassword,
      role: 'Administrador',
      permissions: []
    }
  });

  console.log('✅ Contraseña de ADMIN reseteada exitosamente.');
  console.log('Username: admin');
  console.log('Password: Monar2026!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
