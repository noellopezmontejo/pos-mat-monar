const fs = require('fs');
const path = require('path');

const map = {
  'á': 'á', 'é': 'é', 'Ã\xAD': 'í', 'ó': 'ó', 'ú': 'ú',
  'Á': 'Á', 'É': 'É', 'Ã\x8D': 'Í', 'Ó': 'Ó', 'Ú': 'Ú',
  'ñ': 'ñ', 'Ñ': 'Ñ', '¿': '¿', '¡': '¡'
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.jsx') || p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.prisma') || p.endsWith('.md')) {
      try {
        let content = fs.readFileSync(p, 'utf8');
        let changed = false;
        
        // Fix 3005 -> 3001 just in case
        if (content.includes('localhost:3001')) {
           content = content.replace(/localhost:3001/g, 'localhost:3001');
           changed = true;
        }

        for (const [bad, good] of Object.entries(map)) {
          if (content.includes(bad)) {
            content = content.split(bad).join(good);
            changed = true;
          }
        }
        
        if (changed) {
          console.log(`Repaired: ${p}`);
          fs.writeFileSync(p, content, 'utf8');
        }
      } catch (e) {
        console.error(`Error processing ${p}: ${e.message}`);
      }
    }
  });
};

console.log('--- INICIANDO REPARACIÓN DE EMERGENCIA ---');
walk('./src');
walk('./prisma');
walk('./scripts');
walk('./electron');
console.log('--- REPARACIÓN COMPLETADA ---');
