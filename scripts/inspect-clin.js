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

async function run() {
  try {
    await sql.connect(config);
    const result = await sql.query('SELECT TOP 100 * FROM CLIN01');
    console.log('--- CLIN01 DATA SAMPLES ---');
    console.table(result.recordset.map(r => ({
      CVE_LIN: String(r.CVE_LIN || r.CLV_LIN).trim(),
      DESCR: String(r.DESC_LIN || r.DESCR).trim()
    })));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

run();
