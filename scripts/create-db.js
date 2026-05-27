require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
     console.error("DATABASE_URL no está definida en .env");
     return;
  }
  
  // Reemplazar la base de datos destino por 'postgres' para conexión inicial
  const defaultUrl = dbUrl.replace(/\/\w+(\?.*)?$/, '/postgres$1');
  
  // Extraer el nombre de la BD original
  const dbNameMatch = dbUrl.match(/\/(\w+)(\?.*)?$/);
  const targetDbName = dbNameMatch ? dbNameMatch[1] : 'pos_dbMonar';

  const client = new Client({
    connectionString: defaultUrl
  });

  try {
    await client.connect();
    console.log('Connectado a PostgreSQL default exitosamente.');
    await client.query(`CREATE DATABASE "${targetDbName}"`);
    console.log(`Base de datos "${targetDbName}" creada exitosamente.`);
  } catch (err) {
    if (err.message.includes('already exists')) {
       console.log(`La base de datos "${targetDbName}" ya existe.`);
    } else {
       console.error('Error creando base de datos:', err.message);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
