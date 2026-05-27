const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

console.log('--- REPARACIÓN DE EMERGENCIA: POSMATMONAR ---');

walk('./src', (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Revertir Puertos
    if (content.includes('localhost:3001')) {
      console.log(`Fixing Port: ${filePath}`);
      content = content.replace(/localhost:3001/g, 'localhost:3001');
    }
    
    // 2. Intentar reparar acentos básicos (muy común en Windows manual)
    // No podemos hacer magia, pero al menos aseguramos UTF-8 limpio
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

// Fix server.js specifically
const serverPath = './src/api/server.js';
if (fs.existsSync(serverPath)) {
  let sc = fs.readFileSync(serverPath, 'utf8');
  sc = sc.replace(/localhost:3001/g, 'localhost:3001');
  sc = sc.replace('const PORT = process.env.PORT || 3005', 'const PORT = process.env.PORT || 3001');
  fs.writeFileSync(serverPath, sc, 'utf8');
}

console.log('✅ Port 3001 restored. Encodings rewritten to UTF-8.');
