const fs = require('fs');
const path = require('path');

// Map of common double-encoding / mangled sequences to their Spanish counterparts
const mangledMap = {
  // UTF-8 interpreted as CP1252/ISO-8859-1 then re-saved as UTF-8
  'á': 'á', 'é': 'é', 'Ã\xAD': 'í', 'ó': 'ó', 'ú': 'ú',
  'ñ': 'ñ', 'Ñ': 'Ñ', '¿': '¿', '¡': '¡', 'Ã\x8D': 'Í',
  'Ó': 'Ó', 'Ú': 'Ú', 'É': 'É', 'Á': 'Á',
  // Variants from PowerShell or other redirections
  'â\x80\x94': '—', 'â\x80\x93': '–', 'â\x80\x9c': '“', 'â\x80\x9d': '”',
  'Ã\xad': 'í', 'Ã\xa1': 'á', 'Ã\xb3': 'ó', 'Ã\xba': 'ú', 'Ã\xa9': 'é'
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.css') || p.endsWith('.prisma') || p.endsWith('.md')) {
      let buf = fs.readFileSync(p);
      let changed = false;

      // 1. Remove UTF-8 BOM if present
      if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        console.log(`Removing BOM: ${p}`);
        buf = buf.slice(3);
        changed = true;
      }

      let content = buf.toString('utf8');
      
      // 2. Fix mangled sequences
      for (const [bad, good] of Object.entries(mangledMap)) {
        if (content.includes(bad)) {
          console.log(`Fixing "${bad}" in ${p}`);
          content = content.split(bad).join(good);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(p, content, 'utf8');
      }
    }
  });
};

console.log('--- RESTAURACIÓN DE CODIFICACIÓN Y ACENTOS ---');
walk('./src');
walk('./prisma');
walk('./electron');
walk('./scripts');
console.log('--- PROCESO COMPLETADO ---');
