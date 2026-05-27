const sql = require('mssql')
const { prisma } = require('../src/api/db')
require('dotenv').config()

const config = {
  user: 'sa',
  password: '', // Assume empty or get from user/env if possible
  server: 'localhost',
  database: 'sae4', // Assume from Migration.jsx default
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
}

async function inspect() {
  try {
    await sql.connect(config)
    console.log('--- IMPU01 (Esquemas de Impuestos) ---')
    const impu = await sql.query('SELECT CVEESQIMPU, DESCRIPESQ, IMPUESTO1 FROM IMPU01')
    console.table(impu.recordset)

    console.log('--- INVE01 (Productos - Muestra) ---')
    const inve = await sql.query('SELECT TOP 10 CVE_ART, DESCR, CVE_ESQUEMA FROM INVE01')
    console.table(inve.recordset)

    console.log('--- PostgreSQL TaxScheme Content ---')
    const pgTax = await prisma.taxScheme.findMany()
    console.table(pgTax)

  } catch (err) {
    console.error(err)
  } finally {
    await sql.close()
  }
}

inspect()
