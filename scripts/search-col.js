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

async function search() {
  try {
    await sql.connect(config);
    const res = await sql.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME LIKE '%MARCA%' OR COLUMN_NAME LIKE '%LINEA%'");
    fs.writeFileSync('marca_linea_cols.txt', JSON.stringify(res.recordset, null, 2));
    await sql.close();
    console.log('Search completed: marca_linea_cols.txt');
  } catch (err) {
    console.error(err.message);
  }
}
search();
