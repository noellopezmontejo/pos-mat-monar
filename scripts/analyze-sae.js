const sql = require('mssql');

const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'sae4test',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function analyze() {
  try {
    console.log('--- Diagnóstico de Estructura ASPEL SAE ---');
    await sql.connect(config);
    
    const tables = ['CLIN01', 'INVE01', 'CLIE01', 'PROV01', 'MULT01', 'FACT01', 'COMP01', 'MINV01'];
    
    for (const table of tables) {
      console.log(`\n[TABLA: ${table}]`);
      try {
        const res = await sql.query(`SELECT TOP 0 * FROM ${table}`);
        const columns = res.recordset.columns;
        const colNames = Object.keys(columns).join(', ');
        console.log(`Columnas detectadas: ${colNames}`);
        
        const countRes = await sql.query(`SELECT COUNT(*) as c FROM ${table}`);
        console.log(`Registros totales: ${countRes.recordset[0].c}`);
      } catch (e) {
        console.error(`❌ Error al leer ${table}: ${e.message}`);
      }
    }
    
    await sql.close();
    console.log('\n--- Análisis completado ---');
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}

analyze();
