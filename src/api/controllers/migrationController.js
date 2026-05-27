const { connectToAspel, importClients, importTaxSchemes, importProductLines, importProducts, importPurchases, importSales, importKardex } = require('../utils/aspelMigration')
const { prisma } = require('../db')
const EventEmitter = require('events')
const migrationEvents = new EventEmitter()

const startMigration = async (req, res) => {
  const { config, entity, year } = req.body
  console.log(`[Migration] Iniciando para entidad: ${entity}, Año: ${year}`);
  
  // Limpiar candados o procesos zombies en PostgreSQL antes de iniciar cada módulo
  try {
    await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
      AND state = 'idle';
    `);
    console.log('🧹 Conexiones "idle" de PostgreSQL limpiadas exitosamente.');
  } catch (e) {
    console.log('⚠️ No se pudieron limpiar las conexiones de PG:', e.message);
  }
  
  // Connect to SQL Server
  const connected = await connectToAspel(config)
  if (!connected) {
    return res.status(400).json({ error: 'No se pudo establecer la conexión a la base de datos de ASPEL-SAE (SQL Server).' })
  }

  try {
    let report = null;
    const onProgress = (current, total, message) => {
      migrationEvents.emit('progress', { current, total, message });
    };

    const ent = String(entity || '').trim().toLowerCase();
    
    if (ent === 'clients') {
      report = await importClients(onProgress)
    } else if (ent === 'taxschemes' || ent === 'taxes') {
      report = await importTaxSchemes(onProgress)
    } else if (ent === 'productlines' || ent === 'lines' || ent === 'brands') {
      report = await importProductLines(onProgress)
    } else if (ent === 'inventory' || ent === 'products') {
      report = await importProducts(onProgress)
    } else if (ent === 'purchases') {
      report = await importPurchases(onProgress, year)
    } else if (ent === 'sales') {
      report = await importSales(onProgress, year)
    } else if (ent === 'kardex') {
      report = await importKardex(onProgress, year)
    } else {
      console.error(`[MIGRATION] Entidad no soportada: "${entity}" (ent: "${ent}")`);
      return res.status(400).json({ error: `Entidad no soportada: ${entity}` })
    }

    res.json({ status: 'success', report })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const testConnection = async (req, res) => {
  const { config } = req.body
  const connected = await connectToAspel(config)
  if (connected) {
    return res.json({ status: 'success', message: '¡Conexión a ASPEL-SAE (SQL Server) establecida exitosamente!' })
  } else {
    return res.status(400).json({ error: 'Fallo la conexión. Revisa las credenciales, el firewall o que el servicio de SQL Server esté activo.' })
  }
}

const getMigrationProgress = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  migrationEvents.on('progress', sendProgress);

  req.on('close', () => {
    migrationEvents.removeListener('progress', sendProgress);
  });
}

module.exports = { startMigration, testConnection, getMigrationProgress }
