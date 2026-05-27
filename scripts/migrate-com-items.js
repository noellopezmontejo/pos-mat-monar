const sql = require('mssql');
const { prisma } = require('../src/api/db');

const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'sae4test',
  options: { encrypt: false, trustServerCertificate: true }
};

async function migrateItems() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to SAE DB.');

    // 1. Prefetch mapping data
    console.log('Prefetching data mappings...');
    const prodMap = new Map();
    const allProds = await prisma.product.findMany({ select: { id: true, legacy_code: true } });
    allProds.forEach(p => prodMap.set(p.legacy_code?.trim(), p.id));
    console.log(`Loaded ${prodMap.size} product mappings.`);

    const branchMap = new Map();
    const allBranches = await prisma.branch.findMany();
    allBranches.forEach(b => branchMap.set(b.name.replace('Almacén ', '').trim(), b.id));
    
    const orderRefMap = new Map();
    const allOrders = await prisma.purchaseOrder.findMany({ select: { id: true, folio: true } });
    allOrders.forEach(o => orderRefMap.set(o.folio, o.id));
    console.log(`Loaded ${orderRefMap.size} purchase order mappings.`);

    if (orderRefMap.size === 0) {
      console.log('No purchase orders found! Aborting items migration.');
      return;
    }

    // 2. Stream items from COM0Y1
    await new Promise((resolve, reject) => {
      const itemsChunk = [];
      let isPaused = false;
      let activePromises = [];
      const request = new sql.Request(pool);
      request.stream = true;
      request.query(`SELECT * FROM COM0Y1`);

      let matchedItems = 0;
      let totalRows = 0;
      let count = 0;

      request.on('row', (row) => {
        totalRows++;
        const orderFolio = row.CVE_DOC ? String(row.CVE_DOC).trim() : null;
        const artKey = row.CVE_ART ? String(row.CVE_ART).trim() : null;
        
        if (!orderFolio || !artKey) return;
        
        if (!orderRefMap.has(orderFolio)) return;
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
              console.log(`Inserted ${count} items...`);
            })
            .catch(e => {
                console.error('Error inserting batch!', e.message);
            })
            .finally(() => { isPaused = false; request.resume(); });
          activePromises.push(p);
        }
      });

      request.on('done', async () => {
        await Promise.all(activePromises);
        if (itemsChunk.length > 0) {
          try {
             await prisma.purchaseOrderItem.createMany({ data: itemsChunk, skipDuplicates: true });
             count += itemsChunk.length;
          } catch(e) {
             console.error('Error inserting final batch!', e.message);
          }
        }
        console.log(`Extracción COM0Y terminada. Filas leídas: ${totalRows}, Matched: ${matchedItems}, Final Count: ${count}`);
        resolve();
      });
      request.on('error', reject);
    });

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (pool) pool.close();
    await prisma.$disconnect();
    process.exit(0);
  }
}

migrateItems();
