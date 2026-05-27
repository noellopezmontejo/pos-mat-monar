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
    let out = '--- SECONDARY TABLES DUMP ---\n\n';
    
    // Check custom and extended tables
    const targets = ['tbproducto', 'INVE_CLIB01', 'CAMP01', 'COLOR01', 'TALLA01'];
    for (const t of targets) {
      try {
        const res = await sql.query(`SELECT TOP 1 * FROM ${t}`);
        out += `--- [${t} FIRST ROW] ---\n`;
        out += JSON.stringify(res.recordset[0] || {}, null, 2) + '\n\n';
      } catch (e) {
        out += `Table ${t} not accessible or empty: ${e.message}\n\n`;
      }
    }
    
    fs.writeFileSync('sae_secondary_dump.txt', out);
    await sql.close();
    console.log('Dump completed: sae_secondary_dump.txt');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
dump();
