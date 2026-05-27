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
    await sql.connect(config);
    const tables = ['CLIN01', 'INVE01', 'MULT01'];
    for (const table of tables) {
      const res = await sql.query(`SELECT TOP 1 * FROM ${table}`);
      console.log(`--- TABLE: ${table} ---`);
      if (res.recordset[0]) {
        const keys = Object.keys(res.recordset[0]);
        for (let i = 0; i < keys.length; i += 10) {
          console.log(keys.slice(i, i + 10).join(', '));
        }
      }
    }
    await sql.close();
  } catch (err) {
    console.log('Connection Error:', err.message);
  }
}
analyze();
