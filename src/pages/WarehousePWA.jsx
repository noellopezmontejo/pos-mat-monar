import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, Wifi, WifiOff, MapPin, ScanLine, 
  ChevronRight, ArrowLeft, CheckCircle2, Box, Store, Calendar, LogOut
} from 'lucide-react';
import apiClient from '../utils/apiClient';
import { db, addSyncOperation } from '../utils/db';
import { useSync } from '../hooks/useSync';

export default function WarehousePWA() {
  const { isOnline, isSyncing } = useSync();
  const [pendingOps, setPendingOps] = useState(0);
  const [view, setView] = useState('menu'); // 'menu', 'list_oc', 'detail_oc', 'lookup', 'adjust', 'transfer'
  
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // New states for extended features
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: 'Merma', type: 'OUT' });
  const [transferForm, setTransferForm] = useState({ to_branch_id: '', quantity: '', observations: '' });

  // Detailed Reception states
  const [receptionItems, setReceptionItems] = useState([]);
  const [receptionObservations, setReceptionObservations] = useState('');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get('/api/branches');
      setBranches(res.data);
      await db.branches.clear();
      await db.branches.bulkAdd(res.data);
    } catch (e) {
      const offlineBranches = await db.branches.toArray();
      setBranches(offlineBranches);
    }
  }

  // Fetch pending orders when online
  const fetchOrders = async () => {
    if (!isOnline) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/purchases/orders');
      // Filter only pending for the warehouseman
      const pending = res.data.filter(o => o.status === 'Pendiente');
      setOrders(pending);
      // Cache in Dexie for offline lookup (basic)
      await db.purchase_orders.clear();
      await db.purchase_orders.bulkAdd(pending);
    } catch (e) { console.error("Error fetching orders:", e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    const checkQueue = async () => {
       const count = await db.sync_queue.count();
       setPendingOps(count);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 3000);
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    
    if (isOnline) {
      try {
        const res = await apiClient.get(`/api/inventory/search?query=${val}`);
        setSearchResults(res.data);
      } catch (e) { console.error("Search error:", e); }
    } else {
      // Basic offline search if we had product cache (skipped for brevity unless requested)
      setSearchResults([]);
    }
  };

  const handleAdjust = async () => {
    if (!selectedProduct || !adjustForm.quantity || !adjustForm.branch_id) {
       alert("Completa todos los campos");
       return;
    }

    const payload = {
      product_id: selectedProduct.id,
      branch_id: adjustForm.branch_id,
      quantity: adjustForm.type === 'IN' ? parseInt(adjustForm.quantity) : -parseInt(adjustForm.quantity),
      reason: adjustForm.reason,
      type: adjustForm.type
    };

    if (isOnline) {
      try {
        await apiClient.post('/api/inventory/adjust', payload);
        alert("Ajuste procesado con éxito.");
        setView('menu');
      } catch (e) { alert("Error al ajustar stock online."); }
    } else {
      await addSyncOperation('INSERT', 'adjustments', payload);
      alert("Ajuste registrado offline.");
      setView('menu');
    }
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !transferForm.quantity || !transferForm.from_branch_id || !transferForm.to_branch_id) {
      alert("Completa todos los campos");
      return;
    }

    const payload = {
      product_id: selectedProduct.id,
      from_branch_id: transferForm.from_branch_id,
      to_branch_id: transferForm.to_branch_id,
      quantity: parseInt(transferForm.quantity),
      observations: transferForm.observations
    };

    if (isOnline) {
      try {
        await apiClient.post('/api/inventory/transfer', payload);
        alert("Transferencia completada.");
        setView('menu');
      } catch (e) { alert(e.response?.data?.error || "Error en transferencia."); }
    } else {
      await addSyncOperation('INSERT', 'transfers', payload);
      alert("Transferencia registrada offline.");
      setView('menu');
    }
  };

  const updateReceptionQty = (index, val) => {
    const newItems = [...receptionItems];
    const numVal = parseInt(val) || 0;
    // Cap at remaining quantity? User might want to receive more than ordered (over-delivery), 
    // but usually it's capped. Let's allow flexibility but show a warning if it exceeds.
    newItems[index].quantity = numVal;
    setReceptionItems(newItems);
  };

  const handleConfirmReception = async (orderId) => {
    if (!targetWarehouseId) {
      alert("Por favor selecciona un almacén de destino");
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const received_by = userData.name || 'Almacenista';

    const payload = {
      purchase_order_id: orderId,
      items: receptionItems.filter(i => i.quantity > 0).map(i => ({
        product_id: i.product_id,
        quantity: i.quantity
      })),
      observations: receptionObservations,
      warehouse_id: targetWarehouseId,
      received_by
    };

    if (payload.items.length === 0) {
      alert("Debes recibir al menos un producto con cantidad mayor a 0");
      return;
    }

    if (isOnline) {
      try {
        await apiClient.post('/api/purchases/receptions', payload);
        alert("Recepción confirmada con éxito.");
        fetchOrders();
        setView('menu');
      } catch (e) { 
        console.error(e);
        alert(e.response?.data?.error || "Error al confirmar recepción online."); 
      }
    } else {
      await addSyncOperation('INSERT', 'receptions', payload);
      alert("Recepción registrada offline. Se sincronizará al recuperar conexión.");
      setView('menu');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-xl mb-6">
        <div>
          <h1 className="text-xl font-black tracking-tight">ALMACÉN</h1>
          <p className="text-[10px] uppercase font-bold opacity-60 flex items-center"><Store size={10} className="mr-1"/> PosMatMonar Pro</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {isOnline ? (
             <span className="flex items-center text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20"><Wifi className="w-3 h-3 mr-1"/> ONLINE</span>
          ) : (
             <span className="flex items-center text-[10px] font-black text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20"><WifiOff className="w-3 h-3 mr-1"/> OFFLINE</span>
          )}
          <button 
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-lg transition-all text-white border border-white/10"
          >
             <LogOut size={12}/>
             <span className="text-[10px] font-black uppercase">Salir</span>
          </button>
        </div>
      </div>
      
      {pendingOps > 0 && (
         <div className="mb-4 bg-amber-100 text-amber-900 p-4 rounded-2xl shadow-sm text-xs font-black flex justify-between items-center border border-amber-200">
            <span className="flex items-center"><WifiOff size={14} className="mr-2"/> SINCRONIZACIÓN PENDIENTE</span>
            <span className="bg-amber-900 text-white px-3 py-1 rounded-full text-[10px]">{pendingOps} OPS</span>
         </div>
      )}

      {/* Main Menu */}
      {view === 'menu' && (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in duration-300">
          <button onClick={() => setView('list_oc')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:bg-emerald-50 active:scale-95 transition-all group">
             <div className="p-4 bg-emerald-100 rounded-2xl mb-4 group-hover:bg-emerald-200 transition-colors">
               <ScanLine className="w-10 h-10 text-emerald-600"/>
             </div>
             <span className="font-black text-slate-800 text-lg">Recibir Stock</span>
             <span className="text-xs text-slate-400 font-bold uppercase mt-1">Órdenes Pendientes</span>
          </button>
          
          <button onClick={() => setView('adjust')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:bg-amber-50 active:scale-95 transition-all group">
             <div className="p-4 bg-amber-100 rounded-2xl mb-4 group-hover:bg-amber-200 transition-colors">
               <PackageCheck className="w-10 h-10 text-amber-600"/>
             </div>
             <span className="font-black text-slate-800 text-lg">Ajuste / Mermas</span>
             <span className="text-xs text-slate-400 font-bold uppercase mt-1">Stock Manual</span>
          </button>

          <button onClick={() => setView('transfer')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:bg-blue-50 active:scale-95 transition-all group">
             <div className="p-4 bg-blue-100 rounded-2xl mb-4 group-hover:bg-blue-200 transition-colors">
               <MapPin className="w-10 h-10 text-blue-600"/>
             </div>
             <span className="font-black text-slate-800 text-lg">Transferencias</span>
             <span className="text-xs text-slate-400 font-bold uppercase mt-1">Entre Almacenes</span>
          </button>

          <button onClick={() => setView('lookup')} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center hover:bg-purple-50 active:scale-95 transition-all group">
             <div className="p-4 bg-purple-100 rounded-2xl mb-4 group-hover:bg-purple-200 transition-colors">
               <Box className="w-10 h-10 text-purple-600"/>
             </div>
             <span className="font-black text-slate-800 text-lg">Consulta Stock</span>
             <span className="text-xs text-slate-400 font-bold uppercase mt-1">Buscador Global</span>
          </button>
        </div>
      )}

      {/* List OC View */}
      {view === 'list_oc' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('menu')} className="p-2 bg-white rounded-xl shadow-sm mr-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black text-slate-800">Seleccionar Orden</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Box className="w-12 h-12 text-slate-200 mx-auto mb-4"/>
              <p className="text-slate-400 font-bold">No hay órdenes pendientes</p>
            </div>
          ) : (
            orders.map(o => (
              <button 
                key={o.id} 
                onClick={() => { 
                  setSelectedOrder(o); 
                  setView('detail_oc'); 
                  // Initial quantities based on items
                  const initialItems = o.items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product?.name,
                    legacy_code: item.product?.legacy_code,
                    quantity_ordered: item.quantity,
                    quantity_received_total: item.quantity_received || 0,
                    quantity: item.quantity - (item.quantity_received || 0) // Pending
                  }));
                  setReceptionItems(initialItems);
                  setTargetWarehouseId(o.warehouse_id || '');
                }}
                className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:bg-slate-50"
              >
                <div className="text-left">
                  <p className="text-xs font-black text-emerald-600 uppercase mb-1 tracking-wider">{o.folio}</p>
                  <p className="font-bold text-slate-800 line-clamp-1">{o.supplier?.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center">
                    <Calendar size={10} className="mr-1"/> {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            ))
          )}
        </div>
      )}

      {/* Detail OC View */}
      {view === 'detail_oc' && selectedOrder && (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-300 pb-20">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('list_oc')} className="p-2 bg-white rounded-xl shadow-sm mr-4"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-xl font-black text-slate-800">Recibir: {selectedOrder.folio}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedOrder.supplier?.name}</p>
            </div>
          </div>

          {/* Configuración de Recepción */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Almacén de Destino</label>
              <select 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none"
                value={targetWarehouseId}
                onChange={e => setTargetWarehouseId(e.target.value)}
              >
                <option value="">Seleccionar Almacén...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Observaciones / Notas</label>
              <textarea 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none text-sm min-h-[80px] resize-none"
                placeholder="Estado de la mercancía, faltantes, etc..."
                value={receptionObservations}
                onChange={e => setReceptionObservations(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Items Editables */}
          <div className="space-y-3">
            <div className="px-4 flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos en Orden</span>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{receptionItems.length} ÍTEMS</span>
            </div>
            
            {receptionItems.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="flex-grow">
                  <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{item.product_name}</p>
                  <p className="text-[10px] text-slate-400 font-black uppercase">{item.legacy_code}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[9px] font-bold text-slate-400 p-1 bg-slate-50 rounded">PEDIDO: {item.quantity_ordered}</span>
                    <span className="text-[9px] font-bold text-amber-600 p-1 bg-amber-50 rounded">RECIBIDO: {item.quantity_received_total}</span>
                  </div>
                </div>
                
                <div className="w-24">
                  <label className="text-[9px] font-black text-slate-300 uppercase block mb-1 text-center font-black">A RECIBIR</label>
                  <input 
                    type="number" 
                    className={`w-full p-3 rounded-xl border-none font-black text-center text-lg outline-none transition-all ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}
                    value={item.quantity}
                    onChange={(e) => updateReceptionQty(idx, e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleConfirmReception(selectedOrder.id)}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 sticky bottom-4"
          >
            <CheckCircle2 size={24} className="text-emerald-400" />
            GUARDAR RECEPCIÓN
          </button>
        </div>
      )}

      {/* Inventory Lookup View */}
      {view === 'lookup' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('menu')} className="p-2 bg-white rounded-xl shadow-sm mr-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black text-slate-800">Consulta Global</h2>
          </div>

          <div className="relative mb-6">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Buscar producto o SKU..." 
              className="w-full pl-12 p-5 bg-white rounded-2xl border-none shadow-sm font-bold text-slate-800 outline-none focus:ring-2 ring-purple-500 transition-all"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
             {searchResults.map(p => (
               <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-[10px] font-black text-purple-600 uppercase mb-1 tracking-widest">{p.legacy_code}</p>
                  <p className="font-bold text-slate-800 mb-4">{p.name}</p>
                  <div className="space-y-2">
                     {p.stock?.map(s => (
                       <div key={s.id} className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
                          <span className="font-bold text-slate-500 flex items-center"><Store size={12} className="mr-2"/> {s.branch?.name}</span>
                          <span className="font-black text-slate-900 text-sm">{s.quantity} {p.base_unit}</span>
                       </div>
                     ))}
                     {(!p.stock || p.stock.length === 0) && (
                       <p className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase italic">Sin existencias registradas</p>
                     )}
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Adjustment View */}
      {view === 'adjust' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300 pb-20">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('menu')} className="p-2 bg-white rounded-xl shadow-sm mr-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black text-slate-800">Ajuste de Stock</h2>
          </div>

          {!selectedProduct ? (
            <div className="relative mb-6">
              <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
              <input 
                type="text" 
                placeholder="Escanear o buscar producto..." 
                className="w-full pl-12 p-5 bg-white rounded-2xl border-none shadow-sm font-bold text-slate-800 outline-none ring-amber-500 transition-all"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="mt-4 space-y-2">
                {searchResults.map(p => (
                  <button key={p.id} onClick={() => setSelectedProduct(p)} className="w-full text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm font-bold text-slate-700">{p.name}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-black text-amber-600 uppercase mb-1">{selectedProduct.legacy_code}</p>
                   <p className="font-bold text-slate-800">{selectedProduct.name}</p>
                 </div>
                 <button onClick={() => setSelectedProduct(null)} className="text-xs font-black text-slate-400 uppercase underline">Cambiar</button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setAdjustForm({...adjustForm, type: 'IN'})} className={`p-4 rounded-2xl font-black text-xs uppercase transition-all ${adjustForm.type === 'IN' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Entrada (+)</button>
                 <button onClick={() => setAdjustForm({...adjustForm, type: 'OUT'})} className={`p-4 rounded-2xl font-black text-xs uppercase transition-all ${adjustForm.type === 'OUT' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>Salida (-)</button>
               </div>

               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Sucursal</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none" value={adjustForm.branch_id} onChange={e => setAdjustForm({...adjustForm, branch_id: e.target.value})}>
                      <option value="">Seleccionar Sucursal...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Cantidad</label>
                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-slate-800 text-2xl outline-none" placeholder="0" value={adjustForm.quantity} onChange={e => setAdjustForm({...adjustForm, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Motivo</label>
                    <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}>
                      <option value="Merma">Merma / Desperdicio</option>
                      <option value="Daño">Producto Dañado</option>
                      <option value="Robo">Robo / Extravío</option>
                      <option value="Cuenta">Error de Conteo / Inventario</option>
                      <option value="Devolución">Devolución a Proveedor</option>
                    </select>
                  </div>
               </div>

               <button onClick={handleAdjust} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg tracking-tight hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">PROCESAR AJUSTE</button>
            </div>
          )}
        </div>
      )}

      {/* Transfer View */}
      {view === 'transfer' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-300 pb-20">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('menu')} className="p-2 bg-white rounded-xl shadow-sm mr-4"><ArrowLeft size={20}/></button>
            <h2 className="text-xl font-black text-slate-800">Transferencia</h2>
          </div>

          {!selectedProduct ? (
             <div className="relative mb-6">
               <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
               <input 
                 type="text" 
                 placeholder="Escanear o buscar producto..." 
                 className="w-full pl-12 p-5 bg-white rounded-2xl border-none shadow-sm font-bold text-slate-800 outline-none ring-blue-500 transition-all"
                 value={searchQuery}
                 onChange={(e) => handleSearch(e.target.value)}
               />
               <div className="mt-4 space-y-2">
                 {searchResults.map(p => (
                   <button key={p.id} onClick={() => setSelectedProduct(p)} className="w-full text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm font-bold text-slate-700">{p.name}</button>
                 ))}
               </div>
             </div>
          ) : (
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{selectedProduct.legacy_code}</p>
                   <p className="font-bold text-slate-800">{selectedProduct.name}</p>
                 </div>
                 <button onClick={() => setSelectedProduct(null)} className="text-xs font-black text-slate-400 uppercase underline">Cambiar</button>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Origen</label>
                      <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none text-xs" value={transferForm.from_branch_id} onChange={e => setTransferForm({...transferForm, from_branch_id: e.target.value})}>
                        <option value="">Origen...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Destino</label>
                      <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none text-xs" value={transferForm.to_branch_id} onChange={e => setTransferForm({...transferForm, to_branch_id: e.target.value})}>
                        <option value="">Destino...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Cantidad a Mover</label>
                     <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-slate-800 text-2xl outline-none" placeholder="0" value={transferForm.quantity} onChange={e => setTransferForm({...transferForm, quantity: e.target.value})} />
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Observaciones</label>
                     <textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none text-sm min-h-[80px] resize-none" placeholder="Opcional..." value={transferForm.observations} onChange={e => setTransferForm({...transferForm, observations: e.target.value})} />
                  </div>
               </div>

               <button onClick={handleTransfer} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                 <CheckCircle2 size={24} />
                 REALIZAR TRANSFERENCIA
               </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions Footer */}
      {(view === 'menu' || view === 'lookup') && (
        <div className="mt-8 bg-slate-200/50 p-6 rounded-3xl border border-slate-200 border-dashed mb-10">
           <h3 className="text-slate-600 font-black text-xs uppercase tracking-widest mb-2">Instrucciones de Recepción</h3>
           <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
             1. Escanea o selecciona la orden de compra.<br/>
             2. Verifica físicamente la cantidad de cada producto.<br/>
             3. Si todo es correcto, presiona "Confirmar Todo" para actualizar el stock global.
           </p>
        </div>
      )}
    </div>
  );
}
