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

async function solve() {
  try {
    await sql.connect(config);
    const tablesRes = await sql.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    const tables = tablesRes.recordset.map(r => r.TABLE_NAME);
    
    console.log('--- ESTRUCTURA DE CATEGORIZACIÓN ---');
    
    if (tables.includes('CLIN01')) {
      const res = await sql.query("SELECT TOP 1 * FROM CLIN01");
      console.log('\n[CLIN01 Sample]:', JSON.stringify(res.recordset[0]));
    }
    
    if (tables.includes('INVE01')) {
       const res = await sql.query("SELECT TOP 1 * FROM INVE01");
       const row = res.recordset[0];
       console.log('\n[INVE01 Sample]:', JSON.stringify({
         CLV_ART: row.CLV_ART,
         LIN_PROD: row.LIN_PROD,
         DESC1: row.DESC1,
         DESCR: row.DESCR
       }));
    }

    if (tables.includes('INVE_CLIB01')) {
      const res = await sql.query("SELECT TOP 1 * FROM INVE_CLIB01");
      console.log('\n[INVE_CLIB01 Sample]:', JSON.stringify(res.recordset[0]));
    }

    // Search for tables with "MARCA"
    const marcas = tables.filter(t => t.includes('MARCA'));
    if (marcas.length > 0) {
      console.log('\nTablas de Marcas detectadas:', marcas.join(', '));
      for (const t of marcas) {
        const res = await sql.query(`SELECT TOP 1 * FROM ${t}`);
        console.log(`[${t} Sample]:`, JSON.stringify(res.recordset[0]));
      }
    } else {
      console.log('\nNo se encontraron tablas con "MARCA" en el nombre.');
    }

    await sql.close();
  } catch (err) {
    console.error(err.message);
  }
}
solve();
