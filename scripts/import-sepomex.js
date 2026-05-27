const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Iniciando carga MASIVA del Catálogo SEPOMEX...');
  const filePath = path.join(__dirname, 'CPdescarga.txt');

  if (!fs.existsSync(filePath)) {
    console.error('❌ ERROR: No se encontró el archivo CPdescarga.txt');
    console.log('📌 INSTRUCCIONES:');
    console.log('1. Entra a: https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx');
    console.log('2. Descarga el catálogo en formato TXT (Tubería/Pipe)');
    console.log('3. Coloca el archivo "CPdescarga.txt" dentro de la carpeta "scripts"');
    console.log('4. Vuelve a ejecutar: node scripts/import-sepomex.js');
    process.exit(1);
  }

  const fileStream = fs.createReadStream(filePath, { encoding: 'latin1' }); // Oficialmente viene en ISO-8859-1 (latin1)
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const batchSize = 5000;
  let batch = [];
  let isFirstLine = true;
  let count = 0;

  console.log('Obteniendo estados base...');
  // Mapear los nombres de Estado en el TXT a los IDs internos
  const states = await prisma.geoState.findMany();
  const stateMap = {};
  states.forEach(s => {
     const n = s.name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
     stateMap[n] = s.id;
  });

  // Limpiar localidades previas
  await prisma.geoLocality.deleteMany({});
  console.log('🗑️ Localidades anteriores limpiadas. Importando nuevas...');

  for await (const line of rl) {
    if (isFirstLine || line.startsWith('d_codigo') || line.trim() === '') {
      if(line.startsWith('d_codigo')) isFirstLine = false;
      continue;
    }

    // El TXT usa Pipes "|" como separador.
    // Formato SEPOMEX:
    // 0: d_codigo (CP), 1: d_asenta (Colonia), 2: d_tipo_asenta (Tipo), 3: D_mnpio (Municipio), 4: d_estado (Estado), 5: d_ciudad (Ciudad)
    const columns = line.split('|');
    if (columns.length < 5) continue;

    const zip_code = columns[0].trim();
    const settlement = columns[1].trim();
    const type = columns[2].trim();
    const municipality = columns[3].trim();
    const stateName = columns[4].trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Tratamos de encontrar el state_id. Si no, tomamos el primero o ignoramos (mejor no reventar).
    const state_id = stateMap[stateName] || states[0]?.id;

    if (state_id) {
       batch.push({
          zip_code,
          settlement,
          type,
          municipality,
          state_id
       });
       count++;
    }

    if (batch.length >= batchSize) {
      await prisma.geoLocality.createMany({ data: batch, skipDuplicates: true });
      console.log(`⏳ Insertados ${count} registros...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await prisma.geoLocality.createMany({ data: batch, skipDuplicates: true });
    console.log(`⏳ Insertados ${count} registros...`);
  }

  console.log(`✅ ¡ÉXITO! Se importaron ${count} colonias y códigos postales desde SEPOMEX.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
