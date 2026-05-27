const mysql = require('mysql2/promise');

async function check() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'lmak',
        database: 'fastfood_pos'
    });

    try {
        const [cats] = await db.query("SELECT * FROM categorias");
        const [prods] = await db.query("SELECT * FROM productos");
        const [prods_avail] = await db.query("SELECT * FROM productos WHERE disponible = 1");
        
        console.log("CATEGORIAS:", cats.length);
        console.log("PRODUCTOS TOTALES:", prods.length);
        console.log("PRODUCTOS DISPONIBLES:", prods_avail.length);
        
        if (prods_avail.length > 0) {
            console.log("\nEjemplo de producto disponible:", prods_avail[0]);
        }
        
        if (cats.length > 0) {
            console.log("\nEjemplo de categoria:", cats[0]);
        }

        // Simular el INNER JOIN
        const [joined] = await db.query(`
            SELECT p.*, c.nombre as categoria_nombre 
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE p.disponible = 1
        `);
        console.log("\nPRODUCTOS DISPONIBLES CON CATEGORIA JOIN:", joined.length);
        if (joined.length > 0) {
            console.log("Ejemplo JOIN:", joined[0]);
        } else {
            console.log("¡ADVERTENCIA! El JOIN no devuelve ningún producto.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}
check();
