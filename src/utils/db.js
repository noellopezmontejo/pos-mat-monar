import Dexie from 'dexie';

export const db = new Dexie('PosMatMonarDB');

// Define offline database schema
db.version(1).stores({
  deliveries: 'id, sale_id, route_id, status, address, lat, lng, synced, updated_at',
  routes: 'id, name',
  purchase_orders: 'id, folio, status, supplier_id, warehouse_id', // Cache for offline view
  branches: 'id, name', // Support for branch selection offline
  sync_queue: '++id, type, table, payload, timestamp', // For pending operations
});

/**
 * Agrega una operación a la cola de sincronización.
 * @param {string} type 'INSERT', 'UPDATE', 'DELETE'
 * @param {string} table Nombre de la tabla ('deliveries', 'receptions', etc)
 * @param {object} payload Los datos a sincronizar
 */
export async function addSyncOperation(type, table, payload) {
  try {
    await db.sync_queue.add({
      type,
      table,
      payload,
      timestamp: new Date().toISOString()
    });
    console.log(`Operación offline agregada: ${type} en ${table}`);
  } catch (err) {
    console.error("Error al registrar operación offline", err);
  }
}
