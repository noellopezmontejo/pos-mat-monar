const sql = require('mssql');

async function test(config) {
  try {
    console.log(`Trying connection to ${config.database} on ${config.server}...`);
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    const tables = result.recordset.map(r => r.TABLE_NAME);
    console.log(`✅ Success! Tables in ${config.database}:`);
    console.log(tables.sort().join(', '));
    await sql.close();
    return true;
  } catch (e) {
    console.log(`❌ Failed for ${config.database}: ${e.message}`);
    return false;
  }
}

async function run() {
  const configs = [
    {
      user: 'sa',
      password: '',
      server: 'localhost',
      database: 'sae4',
      options: { encrypt: false, trustServerCertificate: true }
    },
    {
      user: 'sa',
      password: '123456',
      server: 'localhost',
      database: 'sae4test',
      options: { encrypt: false, trustServerCertificate: true }
    }
  ];
  for (const c of configs) {
    await test(c);
  }
}

run();
