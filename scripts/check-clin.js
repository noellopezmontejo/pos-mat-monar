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

async function check() {
  try {
    await sql.connect(config);
    const codes = ["'1'","'2'","'6'","'TRUPE'","'ALAN'","'PVC'"];
    const res = await sql.query(`SELECT CLV_LIN, DESC_LIN FROM CLIN01 WHERE CLV_LIN IN (${codes.join(',')}) OR DESC_LIN LIKE '%TRUPER%'`);
    console.log('Results:', JSON.stringify(res.recordset, null, 2));
    await sql.close();
  } catch (err) {
    console.error(err.message);
  }
}
check();
