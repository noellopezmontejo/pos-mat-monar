const mysql = require('mysql2/promise');

async function check() {
    const config = {
        host: 'localhost',
        user: 'root',
        password: 'lmak',
        database: 'fastfood_pos'
    };
    
    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log('--- TABLES ---');
        const [tables] = await conn.query('SHOW TABLES');
        console.log(tables);

        console.log('\n--- PEDIDOS COLUMNS ---');
        const [pedidosCols] = await conn.query('SHOW COLUMNS FROM pedidos');
        console.table(pedidosCols);

        console.log('\n--- PRODUCTOS COLUMNS ---');
        const [productosCols] = await conn.query('SHOW COLUMNS FROM productos');
        console.table(productosCols);
        
        console.log('\n--- DETALLE_PEDIDOS COLUMNS ---');
        const [detalleCols] = await conn.query('SHOW COLUMNS FROM detalle_pedidos');
        console.table(detalleCols);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (conn) await conn.end();
    }
}

check();
