const sql = require('mssql')
const { prisma } = require('../db')
const { v4: uuidv4 } = require('uuid');

let pool = null;

const connectToAspel = async (config) => {
  try {
    if (pool) return true;
    pool = await sql.connect({ 
      ...config, 
      connectionTimeout: 300000, // 5 minutos de tiempo de espera para conectar bajo carga
      requestTimeout: 3600000    // 1 hora de tiempo de espera para consultas largas
    })
    return true
  } catch (err) {
    console.error('ASPEL connection failed:', err)
    return false
  }
}

const importClients = async (onProgress) => {
  try {
    let count = 0;
    
    let totalClie = 0, totalProv = 0;
    try {
      const resC = await pool.request().query('SELECT COUNT(*) AS c FROM CLIE01');
      if (resC.recordset[0]) totalClie = resC.recordset[0].c;
      const resP = await pool.request().query('SELECT COUNT(*) AS c FROM PROV01');
      if (resP.recordset[0]) totalProv = resP.recordset[0].c;
    } catch (e) { console.error('Error pre-flight count:', e.message); }
    const overallTotal = totalClie + totalProv;
    
    // --- 1. CLIENTES (CLIE01) ---
    await new Promise((resolve, reject) => {
      const customers = [];
      let isPaused = false;
      let activePromises = [];
      
      const request = new sql.Request(pool);
      request.stream = true;
      request.query('SELECT * FROM CLIE01');

      request.on('row', (row) => {
        const code_raw = row.CLV_CLIE || row.CLV_CLPV || row.CVE_CLPV || row.CCLIE;
        const code = code_raw ? String(code_raw).trim() : null;
        if (!code) return;
        
        customers.push({
          legacy_code: code,
          name: String(row.NOMBRE || row.RAZON_SOCIAL || row.RAZON || 'SIN NOMBRE').trim(),
          phone: row.TELEFONO ? String(row.TELEFONO).trim() : null,
          address: row.DIR ? `${String(row.DIR).trim()} ${row.COLONIA ? String(row.COLONIA).trim() : ''}`.trim() : (row.CALLE ? `${String(row.CALLE).trim()} ${row.COLONIA ? String(row.COLONIA).trim() : ''}`.trim() : null),
          credit_limit: (row.LIM_CRED || row.LIMCRED) ? Math.round(parseFloat(row.LIM_CRED || row.LIMCRED) * 100) : 0,
          credit_days: (row.DIAS_CRE || row.DIASCRED) ? parseInt(row.DIAS_CRE || row.DIASCRED) : 0,
          customer_type: 'P1'
        });

        if (customers.length >= 500 && !isPaused) {
          isPaused = true;
          request.pause();
          
          const batch = [...customers];
          customers.length = 0;
          
          const p = prisma.customer.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || (count + 100), `Insertando Tabla CLIE01 (Clientes)...`);
            })
            .catch(e => console.error('Prisma Clie error:', e.message))
            .finally(() => {
              isPaused = false;
              request.resume();
            });
            
          activePromises.push(p);
        }
      });

      request.on('error', err => { console.error('SQL Stream error:', err); reject(err); });
      request.on('done', async () => {
        await Promise.all(activePromises);
        if (customers.length > 0) {
          await prisma.customer.createMany({ data: customers, skipDuplicates: true });
          count += customers.length;
          if (onProgress) onProgress(count, overallTotal || count, `Insertando Tabla CLIE01 (Clientes)...`);
        }
        resolve();
      });
    });

    // --- 2. PROVEEDORES (PROV01) ---
    await new Promise((resolve, reject) => {
      const suppliers = [];
      let isPaused = false;
      let activePromises = [];
      
      const request = new sql.Request(pool);
      request.stream = true;
      request.query('SELECT * FROM PROV01');

      request.on('row', (row) => {
        const code_raw = row.CPROV || row.CLV_PROV || row.CVE_PROV;
        const code = code_raw ? String(code_raw).trim() : null;
        if (!code) return;
        
        suppliers.push({
          legacy_code: code,
          name: String(row.NOMBRE || row.RAZON_SOCIAL || row.RAZON || 'SIN NOMBRE').trim(),
          phone: row.TELEFONO ? String(row.TELEFONO).trim() : null,
          rfc: row.RFC ? String(row.RFC).trim() : null,
          address: row.DIR ? `${String(row.DIR).trim()} ${row.COLONIA ? String(row.COLONIA).trim() : ''}`.trim() : (row.CALLE ? `${String(row.CALLE).trim()} ${row.COLONIA ? String(row.COLONIA).trim() : ''}`.trim() : null),
        });

        if (suppliers.length >= 500 && !isPaused) {
          isPaused = true;
          request.pause();
          
          const batch = [...suppliers];
          suppliers.length = 0;
          
          const p = prisma.supplier.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || (count + 100), `Insertando Tabla PROV01 (Proveedores)...`);
            })
            .catch(e => console.error('Prisma Prov error:', e.message))
            .finally(() => {
              isPaused = false;
              request.resume();
            });
            
          activePromises.push(p);
        }
      });

      request.on('error', err => { console.error('SQL Stream error (PROV01):', err); reject(err); });
      request.on('done', async () => {
        await Promise.all(activePromises);
        if (suppliers.length > 0) {
          await prisma.supplier.createMany({ data: suppliers, skipDuplicates: true });
          count += suppliers.length;
          if (onProgress) onProgress(count, overallTotal || count, `Insertando Tabla PROV01 (Proveedores)...`);
        }
        resolve();
      });
    });

    return { count, message: `Se importaron ${count} registros (Clientes + Proveedores) mediante Streaming.` }
  } catch (err) {
    console.error('importClients failed:', err)
    throw new Error('Fallo la importación de Catálogos C/P: ' + err.message)
  }
}

// --- MIGRACIÓN DE IMPUESTOS (IMPU01) ---
async function importTaxSchemes(onProgress) {
  try {
    const schemes = [];
    const request = new sql.Request(pool);
    request.stream = true;
    request.query('SELECT * FROM IMPU01');

    request.on('row', (row) => {
      const code = String(row.CVEESQIMP || row.CVEESQIMPU || '').trim();
      if (!code) return;
      
      schemes.push({
        num_reg: row.NUM_REG,
        code,
        name: String(row.DESCRIPESQ || '').trim(),
        tax1_rate: parseFloat(row.IMPUESTO1 || 0),
        tax1_apply: parseInt(row.IMP1APLICA || 0),
        tax2_rate: parseFloat(row.IMPUESTO2 || 0),
        tax2_apply: parseInt(row.IMP2APLICA || 0),
        tax3_rate: parseFloat(row.IMPUESTO3 || 0),
        tax3_apply: parseInt(row.IMP3APLICA || 0),
        tax4_rate: parseFloat(row.IMPUESTO4 || 0),
        tax4_apply: parseInt(row.IMP4APLICA || 0),
        coi_account: (row.NCUENCONT || '').trim()
      });
    });

    await new Promise((resolve, reject) => {
      request.on('done', resolve);
      request.on('error', reject);
    });

    let count = 0;
    for (const s of schemes) {
      await prisma.taxScheme.upsert({
        where: { code: s.code },
        update: { ...s },
        create: { ...s }
      });
      count++;
      if (onProgress) onProgress(count, schemes.length, `Importando Esquema Impuestos: ${s.name}`);
    }

    return { count, message: `Migración de Esquemas de Impuestos completa (${count} registros).` }
  } catch (err) {
    console.error('importTaxSchemes failed:', err);
    throw err;
  }
}

// --- MIGRACIÓN DE LÍNEAS (CLIN01) ---
async function importProductLines(onProgress) {
  try {
    const lines = [];
    const request = new sql.Request(pool);
    request.stream = true;
    request.query('SELECT * FROM CLIN01');

    request.on('row', (row) => {
      const code = (row.CLV_LIN || row.CVE_LIN || row.CVE_LINEA || '').trim();
      if (!code) return;
      
      lines.push({
        num_reg: row.NUM_REG,
        code,
        name: String(row.DESC_LIN || row.DESCR || row.DESC_LINEA || '').trim(),
        coi_account: (row.CUENTA_COI || '').trim()
      });
    });

    await new Promise((resolve, reject) => {
      request.on('done', resolve);
      request.on('error', reject);
    });

    let count = 0;
    for (const l of lines) {
      await prisma.productLine.upsert({
        where: { code: l.code },
        update: { ...l },
        create: { ...l }
      });
      count++;
      if (onProgress) onProgress(count, lines.length, `Importando Línea: ${l.name}`);
    }

    return { count, message: `Migración de Líneas completa (${count} registros).` }
  } catch (err) {
    console.error('importProductLines failed:', err);
    throw err;
  }
}

const resolveWarehouseTable = async (suffix = '01') => {
  const request = new sql.Request(pool);
  try {
    const result = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE LOWER(TABLE_NAME) IN ('catalmacen', 'almacenes${suffix}', 'alm${suffix}')
    `);
    
    const tables = result.recordset.map(r => String(r.TABLE_NAME).toLowerCase());
    if (tables.includes('catalmacen')) return 'CatAlmacen';
    if (tables.includes(`almacenes${suffix}`)) return `ALMACENES${suffix}`;
    if (tables.includes(`alm${suffix}`)) return `ALM${suffix}`;
    
    // Wildcard search fallback
    const wildcardResult = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE LOWER(TABLE_NAME) LIKE 'almacenes%' OR LOWER(TABLE_NAME) LIKE 'alm%'
    `);
    const wildcardTables = wildcardResult.recordset.map(r => String(r.TABLE_NAME).toLowerCase());
    
    const foundAlmacenes = wildcardTables.find(t => t.startsWith('almacenes'));
    if (foundAlmacenes) {
      const exactName = wildcardResult.recordset.find(r => r.TABLE_NAME.toLowerCase() === foundAlmacenes).TABLE_NAME;
      return exactName;
    }
    
    const foundAlm = wildcardTables.find(t => t.startsWith('alm'));
    if (foundAlm) {
      const exactName = wildcardResult.recordset.find(r => r.TABLE_NAME.toLowerCase() === foundAlm).TABLE_NAME;
      return exactName;
    }
  } catch (e) {
    console.error('[Migration] Error al resolver tabla de almacenes:', e.message);
  }
  
  return null;
}

const importBranches = async (onProgress, year = '01') => {
  try {
    let suffix = '01';
    if (year && String(year).match(/^\d{4}$/)) {
      // Year was passed, use default company suffix '01'
    } else if (year && year !== 'Todos' && year !== '00') {
      suffix = String(year).padStart(2, '0');
    }

    const tableName = await resolveWarehouseTable(suffix);
    
    if (!tableName) {
      console.log('[Migration] No se detectó ninguna tabla de almacenes en SQL Server. Se creará almacén por defecto (Almacén 1).');
      
      const existingBranches = await prisma.branch.findMany();
      const defaultBranchName = 'Almacén 1 - MATRIZ';
      
      const matchedBranch = existingBranches.find(b => {
        const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
        return key === '1';
      });

      if (!matchedBranch) {
        await prisma.branch.create({
          data: {
            name: defaultBranchName,
            address: 'Principal'
          }
        });
      } else {
        await prisma.branch.update({
          where: { id: matchedBranch.id },
          data: {
            name: defaultBranchName
          }
        });
      }
      
      if (onProgress) {
        onProgress(1, 1, 'Creando Almacén 1 (Por Defecto)...');
      }
      
      return { count: 1, message: 'No se encontraron tablas de almacenes. Se creó/actualizó el Almacén 1 por defecto.' };
    }

    console.log(`[Migration] Resolviendo tabla de almacenes a: ${tableName}`);

    const request = new sql.Request(pool);
    const result = await request.query(`SELECT * FROM ${tableName}`);
    const rows = result.recordset;

    let count = 0;
    const total = rows.length;

    const existingBranches = await prisma.branch.findMany();
    const tLower = tableName.toLowerCase();

    for (const row of rows) {
      let clave = '';
      let nameText = '';
      let addressText = null;

      if (tLower === 'catalmacen') {
        clave = row.CveAlmacen !== undefined && row.CveAlmacen !== null ? String(row.CveAlmacen).trim() : '';
        nameText = row.Descripcion !== undefined && row.Descripcion !== null ? String(row.Descripcion).trim() : '';
        addressText = row.Ubicacion !== undefined && row.Ubicacion !== null ? String(row.Ubicacion).trim() : null;
      } else if (tLower.startsWith('almacenes')) {
        const rawClave = row.CVE_ALM !== undefined ? row.CVE_ALM : (row.NUM_ALM !== undefined ? row.NUM_ALM : (row.CLAVE !== undefined ? row.CLAVE : ''));
        clave = rawClave !== null ? String(rawClave).trim() : '';
        nameText = row.DESCRIP !== undefined && row.DESCRIP !== null ? String(row.DESCRIP).trim() : 
                   (row.DESCR !== undefined && row.DESCR !== null ? String(row.DESCR).trim() : 
                   (row.NOMBRE !== undefined && row.NOMBRE !== null ? String(row.NOMBRE).trim() : ''));
        addressText = row.DIRECCION !== undefined && row.DIRECCION !== null ? String(row.DIRECCION).trim() : null;
      } else {
        const rawClave = row.CVE_ALM !== undefined ? row.CVE_ALM : (row.NUM_ALM !== undefined ? row.NUM_ALM : (row.NUM_ALMA !== undefined ? row.NUM_ALMA : ''));
        clave = rawClave !== null ? String(rawClave).trim() : '';
        nameText = row.DESCR !== undefined && row.DESCR !== null ? String(row.DESCR).trim() : 
                   (row.DESCRIP !== undefined && row.DESCRIP !== null ? String(row.DESCRIP).trim() : '');
        addressText = row.DIRECCION !== undefined && row.DIRECCION !== null ? String(row.DIRECCION).trim() : null;
      }

      if (!clave) continue;

      const formattedName = nameText ? `Almacén ${clave} - ${nameText}` : `Almacén ${clave}`;

      const matchedBranch = existingBranches.find(b => {
        const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
        return key === clave;
      });

      if (matchedBranch) {
        await prisma.branch.update({
          where: { id: matchedBranch.id },
          data: {
            name: formattedName,
            address: addressText
          }
        });
      } else {
        await prisma.branch.create({
          data: {
            name: formattedName,
            address: addressText
          }
        });
      }

      count++;
      if (onProgress) {
        onProgress(count, total, `Migrando Almacén ${clave}: ${nameText || ''}`);
      }
    }

    return { count, message: `Migración de Almacenes completa (${count} registros de ${tableName}).` };
  } catch (err) {
    console.error('importBranches failed:', err);
    throw new Error('Fallo la importación de Almacenes: ' + err.message);
  }
}

const importProducts = async (onProgress) => {
  try {
    let count = 0;
    
    // Precargar marcas y líneas para mapeo rápido
    const allLines = await prisma.productLine.findMany();
    const lineMap = new Map(allLines.map(l => [l.code, l.id]));
    
    const allTaxSchemes = await prisma.taxScheme.findMany();
    const taxMap = new Map(allTaxSchemes.map(ts => [String(ts.code).trim(), ts.id]));
    console.log(`[Migration] Cargados ${taxMap.size} esquemas de impuestos para mapeo. Muestra de claves: ${Array.from(taxMap.keys()).join(', ')}`);
    
    let totalInve = 0, totalMult = 0;
    try {
      const resI = await pool.request().query('SELECT COUNT(*) AS c FROM INVE01');
      if (resI.recordset[0]) totalInve = resI.recordset[0].c;
      const resM = await pool.request().query('SELECT COUNT(*) AS c FROM MULT01');
      if (resM.recordset[0]) totalMult = resM.recordset[0].c;
    } catch (e) { console.error('Error pre-flight count:', e.message); }
    const overallTotal = totalInve + totalMult;
    
    let cat = await prisma.category.findFirst({ where: { name: 'MIGRACION SAE' }})
    if (!cat) cat = await prisma.category.create({ data: { name: 'MIGRACION SAE' }})
    
    let branch = await prisma.branch.findFirst({ where: { name: 'Almacén 1' }})
    if (!branch) branch = await prisma.branch.create({ data: { name: 'Almacén 1' }})

    // --- 1. PRODUCTOS (INVE01) ---
    await new Promise((resolve, reject) => {
      const productsChunk = [];
      let isPaused = false;
      let activePromises = [];
      
      const request = new sql.Request(pool);
      request.stream = true;
      request.query('SELECT * FROM INVE01');

      request.on('row', (row) => {
        const legacy_code = row.CLV_ART ? String(row.CLV_ART).trim() : row.CVE_ART ? String(row.CVE_ART).trim() : null;
        if (!legacy_code) return;

        const costRaw = parseFloat(row.COSTO_PROM || row.COSTO_DIR || row.COSTO || 0) || 0;
        const lastCostRaw = parseFloat(row.ULT_COSTO || 0) || 0;
        const avgCostRaw = parseFloat(row.COSTO_PROM || 0) || 0;

        const lineCode = row.LIN_PROD ? String(row.LIN_PROD).trim() : null;
        let taxSchemeCode = row.CVEESQIMP || row.CVE_ESQUEMA || row.CVE_ESQUEM || null;
        if (taxSchemeCode !== null) taxSchemeCode = String(taxSchemeCode).trim();
        
        const taxId = taxSchemeCode ? taxMap.get(taxSchemeCode) : null;
        if (taxSchemeCode && !taxId) {
           // Si no encuentra, intentar con un cero extra si es un numero solo
           const altCode = taxSchemeCode.length === 1 ? '0' + taxSchemeCode : taxSchemeCode;
           const altId = taxMap.get(altCode);
           if (!altId && count % 500 === 0) {
             console.log(`[Migration Warning] No se encontró esquema para código: "${taxSchemeCode}" (ART: ${legacy_code})`);
           }
        }

        productsChunk.push({
          legacy_code,
          name: row.DESCR ? String(row.DESCR).trim() : row.DESC1 ? String(row.DESC1).trim() : 'SIN NOMBRE',
          barcode: legacy_code, // Usar CLV_ART como barcode también según instrucción
          line_id: lineCode ? (lineMap.get(lineCode) || null) : null,
          tax_scheme_id: taxId || (taxSchemeCode ? taxMap.get('0' + taxSchemeCode) : null) || null,
          base_unit: row.UNI_MED ? String(row.UNI_MED).trim() : 'PZA',
          purchase_unit: row.UNI_COMP ? String(row.UNI_COMP).trim() : null,
          sale_unit: row.UNI_VENTA ? String(row.UNI_VENTA).trim() : null,
          unit_factor: parseFloat(row.FAC_CONV || 1),
          weight: parseFloat(row.PESO || 0),
          volume: parseFloat(row.VOLUMEN || 0),
          status: row.STATUS === 'B' ? 'Inactivo' : 'Activo',
          cost: Math.round(costRaw * 100),
          last_cost: Math.round(lastCostRaw * 100),
          avg_cost: Math.round(avgCostRaw * 100),
          price_1: row.PRECIO1 ? Math.round(parseFloat(row.PRECIO1) * 100) : Math.round((costRaw * 1.30) * 100),
          price_2: row.PRECIO2 ? Math.round(parseFloat(row.PRECIO2) * 100) : Math.round((costRaw * 1.25) * 100),
          price_3: row.PRECIO3 ? Math.round(parseFloat(row.PRECIO3) * 100) : Math.round((costRaw * 1.20) * 100),
          price_4: row.PRECIO4 ? Math.round(parseFloat(row.PRECIO4) * 100) : Math.round((costRaw * 1.15) * 100),
          price_5: row.PRECIO5 ? Math.round(parseFloat(row.PRECIO5) * 100) : Math.round((costRaw * 1.10) * 100),
          price_6: Math.round((costRaw * 1.05) * 100),
          has_lots: row.CON_LOTE === 'S',
          has_series: row.CON_SERIE === 'S',
          is_service: row.TIPO_ELE === 'S',
          category_id: cat.id
        });

        if (productsChunk.length >= 1000 && !isPaused) {
          isPaused = true;
          request.pause();
          
          const batch = [...productsChunk];
          productsChunk.length = 0;
          
          const p = prisma.product.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || (count + 100), `Insertando Tabla INVE01 (Productos)...`);
            })
            .catch(e => console.error('Prisma Prod error:', e.message))
            .finally(() => {
              isPaused = false;
              request.resume();
            });
            
          activePromises.push(p);
        }
      });

      request.on('error', err => { console.error('SQL Stream error (INVE01):', err); reject(err); });
      request.on('done', async () => {
        await Promise.all(activePromises);
        if (productsChunk.length > 0) {
          await prisma.product.createMany({ data: productsChunk, skipDuplicates: true });
          count += productsChunk.length;
          if (onProgress) onProgress(count, overallTotal || count, `Insertando Tabla INVE01 (Productos)...`);
        }
        resolve();
      });
    });

    // --- 2. MULTIALMACÉN (MULT01) ---
    await new Promise(async (resolve, reject) => {
      let mCount = 0;
      const stockChunk = [];
      let isPaused = false;
      let activePromises = [];
      
      const branchMap = new Map();
      const allBranches = await prisma.branch.findMany();
      for (const b of allBranches) {
        const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
        branchMap.set(key, b.id);
      }
      if (!branchMap.has('1')) branchMap.set('1', branch.id);

      // Cargamos productos para mapeo 
      prisma.product.findMany({ select: { id: true, legacy_code: true } }).then(allProducts => {
        const prodMap = new Map(allProducts.map(p => [p.legacy_code, p.id]));
        
        const request = new sql.Request(pool);
        request.stream = true;
        request.query('SELECT * FROM MULT01');

        request.on('row', (row) => {
          const code = row.CLV_ART || row.CVE_ART || row.CCVE_ART;
          const alm = row.ALMACEN || row.CVE_ALM || row.NUM_ALM || '1';
          
          if (!code || !prodMap.has(String(code).trim())) return;
          const legacy_code = String(code).trim();

          const almIdStr = String(alm).trim();
          const branchId = branchMap.has(almIdStr) ? branchMap.get(almIdStr) : branch.id;

          stockChunk.push({
            product_id: prodMap.get(legacy_code),
            branch_id: branchId,
            quantity: parseInt(row.EXIST || row.CANT || 0) || 0
          });

          if (stockChunk.length >= 2000 && !isPaused) {
            isPaused = true;
            request.pause();
            
            const batch = [...stockChunk];
            stockChunk.length = 0;
            
            const p = prisma.stock.createMany({ data: batch, skipDuplicates: true })
              .then(() => {
                mCount += batch.length;
                if (onProgress) onProgress(count + mCount, overallTotal || (count + mCount + 1000), `Insertando Tabla MULT01 (Stock)...`);
              })
              .catch(e => console.error('Prisma Stock error:', e.message))
              .finally(() => {
                isPaused = false;
                request.resume();
              });
              
            activePromises.push(p);
          }
        });

        request.on('error', err => { console.error('SQL Stream error (MULT01):', err); reject(err); });
        request.on('done', async () => {
          await Promise.all(activePromises);
          if (stockChunk.length > 0) {
            await prisma.stock.createMany({ data: stockChunk, skipDuplicates: true });
            mCount += stockChunk.length;
            if (onProgress) onProgress(count + mCount, overallTotal || count + mCount, `Insertando Tabla MULT01 (Stock)...`);
          }
          resolve();
        });
      });
    });

    return { count, message: `Se importaron ${count} productos con su distribución de almacenes mediante Streaming.` }
  } catch (err) {
    console.error('importProducts failed:', err)
    throw new Error('Fallo la importación de Productos: ' + err.message)
  }
}

const importPurchases = async (onProgress, year = '01') => {
  try {
    let count = 0;
    let tableSuffix = '01';
    let yearToFilter = null;

    if (year && String(year).match(/^\d{4}$/)) {
      yearToFilter = parseInt(year);
    } else if (year && year !== 'Todos' && year !== '00') {
      tableSuffix = String(year).padStart(2, '0');
    }

    const companyId = parseInt(tableSuffix);
    let totalComp = 0, totalPty = 0;

    let headersQuery = `SELECT * FROM COMP${tableSuffix}`;
    let countHeadersQuery = `SELECT COUNT(*) AS c FROM COMP${tableSuffix}`;
    let itemsQuery = `SELECT * FROM COM0Y${companyId}`;
    let countItemsQuery = `SELECT COUNT(*) AS c FROM COM0Y${companyId}`;

    if (yearToFilter !== null) {
      headersQuery += ` WHERE YEAR(FECHA_DOC) = ${yearToFilter}`;
      countHeadersQuery += ` WHERE YEAR(FECHA_DOC) = ${yearToFilter}`;
      itemsQuery = `SELECT d.* FROM COM0Y${companyId} d INNER JOIN COMP${tableSuffix} h ON d.CVE_DOC = h.CVE_DOC WHERE YEAR(h.FECHA_DOC) = ${yearToFilter}`;
      countItemsQuery = `SELECT COUNT(*) AS c FROM COM0Y${companyId} d INNER JOIN COMP${tableSuffix} h ON d.CVE_DOC = h.CVE_DOC WHERE YEAR(h.FECHA_DOC) = ${yearToFilter}`;
    }

    try {
      const resC = await pool.request().query(countHeadersQuery);
      totalComp = resC.recordset[0].c;
      // Many SAE 4.x/5.x versions use COM0Y + [CompanyNum without leading zero]
      const resP = await pool.request().query(countItemsQuery);
      totalPty = resP.recordset[0].c;
    } catch (e) { console.error('Error pre-flight count purchases:', e.message); }
    const overallTotal = totalComp + totalPty;

    // Prefetch mappings
    const suppMap = new Map();
    const allSupps = await prisma.supplier.findMany();
    allSupps.forEach(s => suppMap.set(s.legacy_code?.trim(), s.id));

    const prodMap = new Map();
    const allProds = await prisma.product.findMany({ select: { id: true, legacy_code: true } });
    allProds.forEach(p => prodMap.set(p.legacy_code?.trim(), p.id));

    const branchMap = new Map();
    const allBranches = await prisma.branch.findMany();
    allBranches.forEach(b => {
      const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
      branchMap.set(key, b.id);
    });

    const defaultSup = await prisma.supplier.findFirst({ where: { name: 'PROVEEDOR MIGRADO SAE' }});
    const defaultSupId = defaultSup ? defaultSup.id : (await prisma.supplier.create({ data: { name: 'PROVEEDOR MIGRADO SAE', legacy_code: '0' } })).id;

    const defaultUser = await prisma.user.findFirst();
    const userId = defaultUser ? defaultUser.id : 'migrated-user';

    // --- 1. CABECERAS (COMP01) ---
    await new Promise((resolve, reject) => {
      const ordersChunk = [];
      const seenFolios = new Set(); // Filtro de duplicados en memoria
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      request.query(headersQuery);

      request.on('row', (row) => {
        const suppKey = row.CVE_CLPV ? String(row.CVE_CLPV).trim() : null;
        const folio = row.CVE_DOC ? String(row.CVE_DOC).trim() : null;
        if (!folio) return;
        // Ignorar folios duplicados — solo el primero se procesa
        if (seenFolios.has(folio)) return;
        seenFolios.add(folio);

        const almStr = String(row.NUM_ALMA || '1').trim();
        const branchId = branchMap.get(almStr) || null;
        const oId = uuidv4();

        ordersChunk.push({
          id: oId,
          folio,
          supplier_id: suppMap.get(suppKey) || defaultSupId,
          status: row.STATUS === 'C' ? 'Cancelado' : (row.TIP_DOC === 'R' || row.TIP_DOC === 'C' || row.STATUS === 'E') ? 'Recepcionado' : 'Pendiente',
          created_at: row.FECHAELAB || row.FECHA_DOC || new Date(),
          document_date: row.FECHA_DOC || null,
          reception_date: row.FECHA_REC || null,
          payment_date: row.FECHA_PAG || null,
          total_amount: parseFloat(row.IMP_TOT4 || 0),
          subtotal: parseFloat(row.CAN_TOT || 0),
          discount: parseFloat(row.DES_TOT || 0),
          taxes: (parseFloat(row.IMP_TOT1 || 0) + parseFloat(row.IMP_TOT2 || 0) + parseFloat(row.IMP_TOT3 || 0)),
          warehouse_id: branchId,
          observations: row.OBS_COMP ? `Obs ID: ${row.OBS_COMP}` : null
        });

        if (ordersChunk.length >= 500 && !isPaused) {
          isPaused = true;
          request.pause();
          const batch = [...ordersChunk];
          ordersChunk.length = 0;
          const p = prisma.purchaseOrder.createMany({ data: batch, skipDuplicates: true })
            .then(async () => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || 1, `Migrando COMP${tableSuffix} (Ordenes)...`);
              const recs = batch.filter(o => o.status === 'Recepcionado').map(o => ({
                purchase_order_id: o.id,
                received_by: userId,
                created_at: o.reception_date || o.created_at || new Date()
              }));
              if (recs.length > 0) await prisma.reception.createMany({ data: recs, skipDuplicates: true });
            })
            .catch(reject)
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', () => {
        Promise.all(activePromises)
          .then(async () => {
            if (ordersChunk.length > 0) {
              await prisma.purchaseOrder.createMany({ data: ordersChunk, skipDuplicates: true });
              count += ordersChunk.length;
              const recs = ordersChunk.filter(o => o.status === 'Recepcionado').map(o => ({
                purchase_order_id: o.id,
                received_by: userId,
                created_at: o.reception_date || o.created_at || new Date()
              }));
              if (recs.length > 0) await prisma.reception.createMany({ data: recs, skipDuplicates: true });
            }
            resolve();
          })
          .catch(reject);
      });
      request.on('error', reject);
    });

    // --- 2. PARTIDAS (COM0Y1) ---
    const orderRefMap = new Map();
    const allOrders = await prisma.purchaseOrder.findMany({ select: { id: true, folio: true } });
    allOrders.forEach(o => orderRefMap.set(o.folio, o.id));

    await new Promise((resolve, reject) => {
      const itemsChunk = [];
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      console.log(`Iniciando extracción de partidas desde COM0Y${companyId}... Suffix: ${tableSuffix}`);
      request.query(itemsQuery);

      let matchedItems = 0;
      let totalRows = 0;

      request.on('row', (row) => {
        totalRows++;
        const orderFolio = row.CVE_DOC ? String(row.CVE_DOC).trim() : null;
        const artKey = row.CVE_ART ? String(row.CVE_ART).trim() : null;
        if (!orderFolio || !artKey) return;
        if (!orderRefMap.has(orderFolio)) {
          if (totalRows % 1000 === 0) console.log(`Folio [${orderFolio}] no encontrado en map de ${orderRefMap.size} órdenes.`);
          return;
        }
        if (!prodMap.has(artKey)) return;
        matchedItems++;
        const almStr = String(row.NUM_ALM || '1').trim();
        const branchId = branchMap.get(almStr) || null;
        const qty = parseFloat(row.CANT || 0);
        const pxr = parseFloat(row.PXR || 0);
        itemsChunk.push({
          purchase_order_id: orderRefMap.get(orderFolio),
          product_id: prodMap.get(artKey),
          quantity: Math.round(qty),
          quantity_received: Math.round(qty - pxr),
          cost: parseFloat(row.COST || 0),
          price: parseFloat(row.PREC || 0),
          discount: parseFloat(row.DESCU || 0),
          tax_percentage: (parseFloat(row.IMPU1 || 0) + parseFloat(row.IMPU2 || 0) + parseFloat(row.IMPU3 || 0) + parseFloat(row.IMPU4 || 0)),
          unit: row.UNI_VENTA ? String(row.UNI_VENTA).trim() : null,
          warehouse_id: branchId
        });
        if (itemsChunk.length >= 1000 && !isPaused) {
          isPaused = true;
          request.pause();
          const batch = [...itemsChunk];
          itemsChunk.length = 0;
          const p = prisma.purchaseOrderItem.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || 1, `Migrando COM0Y${companyId} (Partidas)...`);
            })
            .catch(reject)
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', () => {
        Promise.all(activePromises)
          .then(async () => {
            if (itemsChunk.length > 0) {
              await prisma.purchaseOrderItem.createMany({ data: itemsChunk, skipDuplicates: true });
              count += itemsChunk.length;
            }
            console.log(`Extracción COM0Y terminada. Filas leídas: ${totalRows}, Matched: ${matchedItems}, Final Count: ${count}`);
            resolve();
          })
          .catch(reject);
      });
      request.on('error', reject);
    });

    return { count, message: `Migración de Compras completa (${count} registros).` }
  } catch (err) {
    console.error('importPurchases failed:', err)
    throw err;
  }
}

const importSales = async (onProgress, year = '01') => {
  try {
    let count = 0;
    let tableSuffix = '01';
    let yearToFilter = null;

    if (year && String(year).match(/^\d{4}$/)) {
      yearToFilter = parseInt(year);
    } else if (year && year !== 'Todos' && year !== '00') {
      tableSuffix = String(year).padStart(2, '0');
    }

    const companyId = parseInt(tableSuffix);
    let totalFact = 0, totalPty = 0;
    
    let headersQuery = `SELECT * FROM FACT${tableSuffix}`;
    let countHeadersQuery = `SELECT COUNT(*) AS c FROM FACT${tableSuffix}`;
    let itemsQuery = `SELECT * FROM FA0TY${companyId}`;
    let countItemsQuery = `SELECT COUNT(*) AS c FROM FA0TY${companyId}`;

    if (yearToFilter !== null) {
      headersQuery += ` WHERE YEAR(FECHA_DOC) = ${yearToFilter}`;
      countHeadersQuery += ` WHERE YEAR(FECHA_DOC) = ${yearToFilter}`;
      itemsQuery = `SELECT d.* FROM FA0TY${companyId} d INNER JOIN FACT${tableSuffix} h ON d.CVE_DOC = h.CVE_DOC WHERE YEAR(h.FECHA_DOC) = ${yearToFilter}`;
      countItemsQuery = `SELECT COUNT(*) AS c FROM FA0TY${companyId} d INNER JOIN FACT${tableSuffix} h ON d.CVE_DOC = h.CVE_DOC WHERE YEAR(h.FECHA_DOC) = ${yearToFilter}`;
    }

    try {
      const resC = await pool.request().query(countHeadersQuery);
      totalFact = resC.recordset[0].c;
      const resP = await pool.request().query(countItemsQuery);
      totalPty = resP.recordset[0].c;
    } catch (e) { console.error('Error pre-flight count sales:', e.message); }
    const overallTotal = totalFact + totalPty;

    // Prefetch mappings
    const cliMap = new Map();
    const allClis = await prisma.customer.findMany();
    allClis.forEach(c => cliMap.set(c.legacy_code?.trim(), c.id));

    const prodMap = new Map();
    const allProds = await prisma.product.findMany({ select: { id: true, legacy_code: true } });
    allProds.forEach(p => prodMap.set(p.legacy_code?.trim(), p.id));

    const branchMap = new Map();
    const allBranches = await prisma.branch.findMany();
    allBranches.forEach(b => {
      const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
      branchMap.set(key, b.id);
    });

    const defaultUser = await prisma.user.findFirst();
    const userId = defaultUser ? defaultUser.id : 'migrated-user';

    // --- 1. CABECERAS (FACT01) ---
    await new Promise(async (resolve, reject) => {
      const salesChunk = [];
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      request.query(headersQuery);

      request.on('row', (row) => {
        const cliKey = row.CVE_CLPV ? String(row.CVE_CLPV).trim() : null;
        const folio = row.CVE_DOC ? String(row.CVE_DOC).trim() : null;
        if (!folio) return;

        const almStr = String(row.NUM_ALMA || '1').trim();
        const branchId = branchMap.get(almStr) || null;

        salesChunk.push({
          folio,
          customer_id: cliMap.get(cliKey) || (allClis[0]?.id || 'default'),
          type: row.TIP_DOC === 'R' ? 'Remisión' : 'Factura',
          status: row.STATUS === 'C' ? 'Cancelado' : 'Pagado',
          created_at: row.FECHAELAB || row.FECHA_DOC || new Date(),
          document_date: row.FECHA_DOC || null,
          total_amount: parseFloat(row.IMP_TOT4 || 0),
          subtotal: parseFloat(row.CAN_TOT || 0),
          discount: parseFloat(row.DES_TOT || 0),
          taxes: (parseFloat(row.IMP_TOT1 || 0) + parseFloat(row.IMP_TOT2 || 0) + parseFloat(row.IMP_TOT3 || 0)),
          warehouse_id: branchId,
          observations: row.STR_OBS ? `Obs ID: ${row.STR_OBS}` : null,
          created_by: userId
        });

        if (salesChunk.length >= 500 && !isPaused) {
          isPaused = true;
          request.pause();
          const batch = [...salesChunk];
          salesChunk.length = 0;
          const p = prisma.sale.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || 1, `Migrando FACT${tableSuffix} (Ventas)...`);
            })
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', async () => {
        await Promise.all(activePromises);
        if (salesChunk.length > 0) {
          await prisma.sale.createMany({ data: salesChunk, skipDuplicates: true });
          count += salesChunk.length;
        }
        resolve();
      });
      request.on('error', reject);
    });

    // --- 2. PARTIDAS (PAR_FACT01) ---
    const saleRefMap = new Map();
    const allSales = await prisma.sale.findMany({ select: { id: true, folio: true } });
    allSales.forEach(s => saleRefMap.set(s.folio, s.id));

    await new Promise(async (resolve, reject) => {
      const itemsChunk = [];
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      request.query(itemsQuery);

      request.on('row', (row) => {
        const saleFolio = row.CVE_DOC ? String(row.CVE_DOC).trim() : null;
        const artKey = row.CVE_ART ? String(row.CVE_ART).trim() : null;
        if (!saleFolio || !artKey || !saleRefMap.has(saleFolio) || !prodMap.has(artKey)) return;

        const almStr = String(row.NUM_ALM || '1').trim();
        const branchId = branchMap.get(almStr) || null;
        const qty = parseFloat(row.CANT || 0);

        itemsChunk.push({
          sale_id: saleRefMap.get(saleFolio),
          product_id: prodMap.get(artKey),
          quantity: Math.round(qty),
          price: parseFloat(row.PREC || 0),
          cost: parseFloat(row.COST || 0),
          discount: parseFloat(row.DESCU || 0),
          tax_percentage: (parseFloat(row.IMPU1 || 0) + parseFloat(row.IMPU2 || 0) + parseFloat(row.IMPU3 || 0) + parseFloat(row.IMPU4 || 0)),
          unit: row.UNI_VENTA ? String(row.UNI_VENTA).trim() : null,
          warehouse_id: branchId
        });

        if (itemsChunk.length >= 1000 && !isPaused) {
          isPaused = true; 
          request.pause();
          const batch = [...itemsChunk];
          itemsChunk.length = 0;
          const p = prisma.saleItem.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, overallTotal || 1, `Migrando FA0TY${companyId} (Partidas)...`);
            })
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', async () => {
        await Promise.all(activePromises);
        if (itemsChunk.length > 0) {
          await prisma.saleItem.createMany({ data: itemsChunk, skipDuplicates: true });
          count += itemsChunk.length;
        }
        resolve();
      });
      request.on('error', reject);
    });

    return { count, message: `Migración de Ventas completa (${count} registros).` }
  } catch (err) {
    console.error('importSales failed:', err)
    throw err;
  }
}

const importKardex = async (onProgress, year = '01') => {
  try {
    let count = 0;
    let tableSuffix = '01';
    let yearToFilter = null;

    if (year && String(year).match(/^\d{4}$/)) {
      yearToFilter = parseInt(year);
    } else if (year && year !== 'Todos' && year !== '00') {
      tableSuffix = String(year).padStart(2, '0');
    }

    const defaultUser = await prisma.user.findFirst();
    const userId = defaultUser ? defaultUser.id : 'migrated-user';

    const prodMap = new Map();
    const allProds = await prisma.product.findMany({ select: { id: true, legacy_code: true } });
    allProds.forEach(p => prodMap.set(p.legacy_code?.trim(), p.id));

    const branchMap = new Map();
    const allBranches = await prisma.branch.findMany();
    allBranches.forEach(b => {
      const key = b.name.replace('Almacén ', '').split(' ')[0].trim();
      branchMap.set(key, b.id);
    });

    let concepts = new Map();
    try {
      const res = await pool.request().query(`SELECT NUM_CPTO, DESCR, CPN FROM CONM01`);
      res.recordset.forEach(c => concepts.set(parseInt(c.NUM_CPTO), { descr: c.DESCR.trim(), sign: c.CPN.trim() }));
    } catch(e) {}

    let totalMinv = 0;
    let queryMinv = `SELECT * FROM MINV${tableSuffix}`;
    let countMinv = `SELECT COUNT(*) AS c FROM MINV${tableSuffix}`;

    if (yearToFilter !== null) {
      queryMinv += ` WHERE YEAR(FECHA_DOCU) = ${yearToFilter}`;
      countMinv += ` WHERE YEAR(FECHA_DOCU) = ${yearToFilter}`;
    }

    try {
      const resM = await pool.request().query(countMinv);
      totalMinv = resM.recordset[0].c;
    } catch(e) {}

    await new Promise(async (resolve, reject) => {
      const chunk = [];
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      request.query(queryMinv);

      request.on('row', (row) => {
        const artKey = row.CLV_ART ? String(row.CLV_ART).trim() : null;
        if (!artKey || !prodMap.has(artKey)) return;

        const cptoKey = parseInt(row.TIPO_MOV || 0);
        const cpto = concepts.get(cptoKey) || { descr: `Mov ${cptoKey}`, sign: '1' };
        const almId = String(row.ALMACEN || '1').trim();

        chunk.push({
          product_id: prodMap.get(artKey),
          branch_id: branchMap.get(almId) || null,
          type: (cpto.sign === '1' || cpto.sign === '+') ? 'IN' : 'OUT',
          reason: cpto.descr,
          quantity: Math.abs(Math.round(parseFloat(row.CANT || 0))),
          balance: Math.round(parseFloat(row.EXIST_G || row.DB8EXIST || 0)),
          cost: parseFloat(row.COSTO || 0),
          price: parseFloat(row.PRECIO || 0),
          reference: row.REFER ? String(row.REFER).trim() : null,
          user_id: userId,
          created_at: row.FECHAELAB || row.FECHA_DOCU || new Date()
        });

        if (chunk.length >= 1000 && !isPaused) {
          isPaused = true;
          request.pause();
          const batch = [...chunk];
          chunk.length = 0;
          const p = prisma.kardex.createMany({ data: batch, skipDuplicates: true })
            .then(() => {
              count += batch.length;
              if (onProgress) onProgress(count, totalMinv || 1, `Migrando Inventario (Kardex)...`);
            })
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', async () => {
        await Promise.all(activePromises);
        if (chunk.length > 0) {
          await prisma.kardex.createMany({ data: chunk, skipDuplicates: true });
          count += chunk.length;
        }
        resolve();
      });
      request.on('error', reject);
    });

    return { count, message: `Migración de Kardex completa (${count} registros).` }
  } catch (err) {
    console.error('importKardex failed:', err)
    throw err;
  }
}

module.exports = { connectToAspel, importClients, importTaxSchemes, importProductLines, importBranches, importProducts, importPurchases, importSales, importKardex }

