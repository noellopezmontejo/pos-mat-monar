const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const sql = fs.readFileSync('scripts/pg_import.sql', 'utf8');
    const statements = sql.split(';\n').filter(s => s.trim().length > 0);
    console.log(`Executing ${statements.length} SQL statements...`);

    for(let i = 0; i < statements.length; i++) {
        // truncate to 50 chars for logging
        const preview = statements[i].substring(0, 50);
        console.log(`Executing batch \${i+1}/\${statements.length}: \${preview}...`);
        try {
            await prisma.$executeRawUnsafe(statements[i] + ';');
            console.log(`Success!`);
        } catch (err) {
            console.error(`Error on batch \${i+1}:`, err.message);
        }
    }
    console.log('Database import completed successfully.');
}

run().catch(console.dir).finally(() => prisma.$disconnect());
