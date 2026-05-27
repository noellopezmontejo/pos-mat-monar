const sql = require('mssql');
const fs = require('fs');

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

async function dump() {
  try {
    await sql.connect(config);
    let out = '--- SAE4TEST SCHEMA DUMP ---\n\n';
    
    const tablesRes = await sql.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    const tables = tablesRes.recordset.map(r => r.TABLE_NAME);
    out += 'All Tables: ' + tables.join(', ') + '\n\n';
    
    const targets = ['CLIN01', 'INVE01', 'INVE_CLIB01', 'FAMILIA01', 'MARCAS01', 'CUENTA01'];
    for (const t of targets) {
      if (tables.includes(t)) {
        try {
          const res = await sql.query(`SELECT TOP 1 * FROM ${t}`);
          out += `--- [${t} FIRST ROW] ---\n`;
          out += JSON.stringify(res.recordset[0] || {}, null, 2) + '\n\n';
        } catch (e) {
          out += `Error reading ${t}: ${e.message}\n\n`;
        }
      }
    }
    
    fs.writeFileSync('sae_schema_dump.txt', out);
    await sql.close();
    console.log('Dump completed: sae_schema_dump.txt');
  } catch (err) {
    console.error('Connection Error:', err.message);
  }
}
dump();
