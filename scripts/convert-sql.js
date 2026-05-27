const fs = require('fs');

console.log('Reading sql dump...');
const sql = fs.readFileSync('scripts/scriptcatfacturacion.sql', 'utf8');
const lines = sql.split('\n');

let outStr = '';
let totalInsertsCount = 0;

for (let line of lines) {
    if (line.toLowerCase().startsWith('insert')) {
        // Find the table name: `table`
        const tableMatch = /insert\s+into\s+`([^`]+)`/.exec(line);
        if(!tableMatch) continue;
        const tableName = tableMatch[1];
        
        // Find the columns
        const colMatch = /\(([^)]+)\)/.exec(line);
        if(!colMatch) continue;
        const cols = colMatch[1].replace(/`/g, '"');
        
        // Find the values string
        const valStart = line.toLowerCase().indexOf('values');
        let valStr = line.substring(valStart + 6).trim();
        if (valStr.endsWith(';')) valStr = valStr.substring(0, valStr.length - 1);
        
        // Safely replace escaping
        // 1. replace \' with ''
        let safeVal = valStr.replace(/\\'/g, "''");
        // 2. replace \\ with \
        safeVal = safeVal.replace(/\\\\/g, "\\");
        
        outStr += `INSERT INTO "${tableName}" (${cols}) VALUES ${safeVal};\n`;
        totalInsertsCount++;
    } else if (line.toLowerCase().startsWith('set ') || line.startsWith('/*')) {
        // Ignore MySQL vars
    }
}

fs.writeFileSync('scripts/pg_import.sql', outStr);
console.log('Wrote converted SQL to pg_import.sql');
console.log('Total insert statements transformed: ', totalInsertsCount);
