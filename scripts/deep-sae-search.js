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

async function probe() {
  try {
    await sql.connect(config);
    let out = '--- DEEP SAE PROBE ---\n\n';
    
    // 1. Search columns in all tables
    const colRes = await sql.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%MARC%' OR COLUMN_NAME LIKE '%LINE%' OR COLUMN_NAME LIKE '%FAM%'");
    out += '--- RELEVANT COLUMNS ---\n';
    out += JSON.stringify(colRes.recordset, null, 2) + '\n\n';
    
    // 2. Dump LIN_PROD from INVE01
    const invRes = await sql.query("SELECT TOP 20 CLV_ART, DESCR, LIN_PROD FROM INVE01");
    out += '--- INVE01 SAMPLES ---\n';
    out += JSON.stringify(invRes.recordset, null, 2) + '\n\n';
    
    if (colRes.recordset.some(c => c.TABLE_NAME === 'CLIN01')) {
       const clRes = await sql.query("SELECT TOP 20 * FROM CLIN01");
       out += '--- CLIN01 SAMPLES ---\n';
       out += JSON.stringify(clRes.recordset, null, 2) + '\n\n';
    }

    fs.writeFileSync('deep_sae_probe.txt', out);
    await sql.close();
    console.log('Probe completed: deep_sae_probe.txt');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
probe();
