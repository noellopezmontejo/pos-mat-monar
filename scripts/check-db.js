const { Client } = require('pg')
require('dotenv').config()

async function setup() {
  const connectionString = process.env.DATABASE_URL
  const client = new Client({ connectionString })

  try {
    console.log('--- Verificando Conexión a PostgreSQL ---')
    await client.connect()
    console.log('✅ Conexión exitosa a PostgreSQL.')
    
    // Check if tables exist
    const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
    if (res.rows.length === 0) {
      console.log('⚠️ La base de datos está vacía. Debes ejecutar las migraciones de Prisma.')
      console.log('Ejecuta: npx prisma migrate dev --name init')
    } else {
      console.log(`✅ Se encontraron ${res.rows.length} tablas.`)
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err.message)
    console.log('\n--- Instrucciones de Configuración ---')
    console.log('1. Asegúrate de tener PostgreSQL instalado y corriendo.')
    console.log('2. Crea una base de datos llamada "pos_db".')
    console.log('3. Revisa tu archivo .env y asegúrate de que DATABASE_URL sea correcta.')
    console.log('   Ejemplo: DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/pos_db?schema=public"')
  } finally {
    await client.end()
  }
}

setup()
