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
    const queries = {
      'INVE01': 'SELECT TOP 1 * FROM INVE01',
      'CLIN01': 'SELECT TOP 1 * FROM CLIN01',
      'CLIE01': 'SELECT TOP 1 * FROM CLIE01',
      'PROV01': 'SELECT TOP 1 * FROM PROV01',
      'MINV01': 'SELECT TOP 1 * FROM MINV01',
      'MULT01': 'SELECT TOP 1 * FROM MULT01'
    };

    for (const [table, q] of Object.entries(queries)) {
      try {
        const res = await sql.query(q);
        const cols = Object.keys(res.recordset[0] || {});
        console.log(`--- [${table}] ---`);
        console.log(`Total Columns: ${cols.length}`);
        const interesting = ['CVE_ART', 'CLV_ART', 'DESCR', 'DESC1', 'LIN_PROD', 'UNI_MED', 'ULT_COSTO', 'COSTO_PROM', 'CVE_LIN', 'CLV_LIN', 'DESC_LIN', 'CLV_CLIE', 'CLV_CLPV', 'CVE_CLPV', 'CVE_DOC', 'CVE_ART', 'CANT', 'PREC', 'COST', 'UNI_VENTA', 'UNI_COMP', 'FAC_CONV'];
        const found = interesting.filter(k => cols.includes(k));
        console.log(`Found fields: ${found.join(', ')}`);
        
        if (table === 'MULT01') {
           console.log(`MULT01 Sample: ${JSON.stringify(res.recordset[0])}`);
        }
      } catch (e) { 
        console.log(`Error ${table}: ${e.message}`); 
      }
    }
    await sql.close();
  } catch (err) {
    console.log('Main Error:', err.message);
  }
}
analyze();
