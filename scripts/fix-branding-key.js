const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.companyProfile.findFirst();
  if (p) {
    await prisma.companyProfile.update({
      where: { id: p.id },
      data: { 
        branding_key: 'NC-2026-ADMIN',
        app_name: 'NC INTEGRAX'
      }
    });
    console.log('✅ Perfil actualizado con la llave: NC-2026-ADMIN');
  } else {
    console.log('⚠️ No se encontró perfil para actualizar.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
