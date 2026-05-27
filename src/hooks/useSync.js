import { useEffect, useState } from 'react';
import { db } from '../utils/db';
import apiClient from '../utils/apiClient';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      triggerSync();
    }

    // Periodic sync attempt (every 1 minute) if online
    const interval = setInterval(() => {
      if (navigator.onLine) triggerSync();
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      setIsSyncing(true);
      const pendingOps = await db.sync_queue.toArray();
      if (pendingOps.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`Intentando sincronizar ${pendingOps.length} operaciones...`);
      
      const response = await apiClient.post('/api/sync', 
        { operations: pendingOps }
      );
      
      if (response.data.status === 'synced') {
        const idsToDelete = pendingOps.map(op => op.id);
        await db.sync_queue.bulkDelete(idsToDelete);
        console.log('Sincronización exitosa.');
      }
    } catch (err) {
      console.error('Error durante la sincronización:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, triggerSync };
}
