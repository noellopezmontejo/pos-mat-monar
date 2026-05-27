import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Download, Send, CheckCircle, Receipt, Building2, 
  ShoppingBag, Calendar, MapPin, X, Filter, User, ArrowRight,
  Plus, History, Trash2, CreditCard, ChevronDown, CheckSquare, Square,
  Clock, AlertTriangle, FileBarChart
} from 'lucide-react';
import apiClient from '../utils/apiClient'; // Use our configured apiClient
import { useCompany } from '../contexts/CompanyContext';

export default function Facturacion() {
  const { profile } = useCompany();
  const [activeTab, setActiveTab] = useState('sales'); 
  const [sales, setSales] = useState([]);
  const [history, setHistory] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Selection Logic
  const [selectedSales, setSelectedSales] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modals & Forms
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedCfdi, setSelectedCfdi] = useState(null);

  // Global Invoice State
  const [isGlobal, setIsGlobal] = useState(false);
  const [globalInfo, setGlobalInfo] = useState({ periodicidad: '01', meses: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`, anio: new Date().getFullYear().toString() });
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [successData, setSuccessData] = useState(null);
  const [errorText, setErrorText] = useState('');
  
  const fetchData = async () => {
    setDataLoading(true);
    try {
      const [salesRes, historyRes, customersRes] = await Promise.all([
        apiClient.get('/api/sales'),
        apiClient.get('/api/billing'),
        apiClient.get('/api/customers')
      ]);
      setSales(salesRes.data);
      setHistory(historyRes.data);
      setCustomers(customersRes.data);
    } catch (e) { 
      console.error('Error fetching data:', e);
      setErrorText('Error al conectar con el servidor. Verifica tu conexión.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Selection Helper
  const toggleSaleSelection = (sale) => {
    if (selectedSales.includes(sale.id)) {
      setSelectedSales(selectedSales.filter(id => id !== sale.id));
      if (selectedSales.length === 1) setSelectedCustomer(null);
    } else {
      if (selectedSales.length > 0) {
        const firstSale = sales.find(s => s.id === selectedSales[0]);
        if (firstSale.customer_id !== sale.customer_id) {
          alert('Solo puedes consolidar ventas del mismo cliente.');
          return;
        }
      }
      setSelectedSales([...selectedSales, sale.id]);
      setSelectedCustomer(sale.customer);
    }
  };

  const handleInvoiceSelected = async () => {
    if (selectedSales.length === 0) return;
    setLoading(true);
    setErrorText('');
    
    try {
      const res = await apiClient.post('/api/billing/invoice', {
        sale_ids: selectedSales,
        fiscal_client_id: selectedCustomer?.fiscal_id || null,
        is_global: isGlobal,
        global_info: isGlobal ? globalInfo : null
      });
      
      setSuccessData(res.data.cfdi);
      setIsBillingModalOpen(true);
      setSelectedSales([]);
      fetchData();
    } catch (err) {
      setErrorText(err.response?.data?.error || 'Error al generar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async (reason) => {
    try {
      setLoading(true);
      await apiClient.post('/api/billing/cancel', {
        id: selectedCfdi.id,
        reason
      });
      
      setIsCancelModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error al cancelar factura');
    } finally {
      setLoading(false);
    }
  };

  // Filter out sales that are already invoiced
  const pendingSales = sales.filter(s => s.status !== 'CANCELLED' && (!s.cfdis || s.cfdis.length === 0));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <Building2 className="mr-3 text-primary-600" size={32} />
            Módulo de Facturación Fiscal
          </h1>
          <p className="text-gray-500 font-medium">Gestión integral de CFDI 4.0 para {profile?.app_name}</p>
        </div>
        
        <div className="flex items-center space-x-3">
           <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facturas del Mes</p>
              <p className="text-2xl font-black text-primary-600">{history.length}</p>
           </div>
           <button onClick={fetchData} className="p-4 bg-white text-gray-400 border border-gray-100 rounded-2xl shadow-sm hover:text-primary-600 transition-all active:scale-95">
              <History size={24} className={dataLoading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200 max-w-fit">
        {[
          { id: 'sales', label: 'Pendientes de Facturar', icon: ShoppingBag },
          { id: 'history', label: 'Historial de CFDI', icon: History },
          { id: 'global', label: 'Factura Global', icon: FileBarChart }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={18} />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'sales' && (
        <div className="space-y-4">
          {/* Action Bar for Selection */}
          {selectedSales.length > 0 && (
            <div className="bg-primary-600 p-4 rounded-2xl animate-in slide-in-from-top-4 duration-500">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center space-x-4 text-white">
                   <div className="bg-white/20 p-2 rounded-lg">
                      <Receipt size={20} />
                   </div>
                   <div>
                      <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Consolidación de Ventas</p>
                      <p className="font-black text-lg">{selectedSales.length} Ventas seleccionadas de {selectedCustomer?.name}</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                    <button onClick={() => setSelectedSales([])} className="px-4 py-2 text-white/80 font-bold hover:text-white transition-colors">Cancelar</button>
                    <button 
                      onClick={handleInvoiceSelected}
                      disabled={loading}
                      className="px-8 py-3 bg-white text-primary-600 rounded-xl font-black shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
                    >
                      {loading ? <Clock className="animate-spin" /> : <ArrowRight size={18} />}
                      <span>Facturar Consolidado</span>
                    </button>
                 </div>
               </div>
               
               {/* Global Invoice Options */}
               {selectedCustomer && (selectedCustomer.name.toLowerCase().includes('general') || selectedCustomer.name.toLowerCase().includes('mostrador') || selectedCustomer.legacy_code === '0') && (
                 <div className="mt-4 pt-4 border-t border-white/20 text-white flex flex-wrap items-center gap-4">
                    <label className="flex items-center space-x-2 font-bold text-sm cursor-pointer">
                      <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="rounded text-primary-500 focus:ring-primary-500 w-4 h-4" />
                      <span>Es Factura Global</span>
                    </label>
                    {isGlobal && (
                      <div className="flex items-center space-x-3 text-sm text-gray-900">
                        <select className="px-3 py-1.5 rounded-lg border-none" value={globalInfo.periodicidad} onChange={e => setGlobalInfo({...globalInfo, periodicidad: e.target.value})}>
                          <option value="01">Diario</option>
                          <option value="02">Semanal</option>
                          <option value="03">Quincenal</option>
                          <option value="04">Mensual</option>
                        </select>
                        <select className="px-3 py-1.5 rounded-lg border-none" value={globalInfo.meses} onChange={e => setGlobalInfo({...globalInfo, meses: e.target.value})}>
                          {Array.from({length: 12}).map((_, i) => <option key={i} value={(i+1).toString().padStart(2, '0')}>{new Date(0, i).toLocaleString('es', {month: 'long'})}</option>)}
                        </select>
                        <input type="number" className="px-3 py-1.5 rounded-lg border-none w-20" value={globalInfo.anio} onChange={e => setGlobalInfo({...globalInfo, anio: e.target.value})} />
                      </div>
                    )}
                 </div>
               )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 text-left w-12"></th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Remisión</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingSales.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center">
                       <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                       <p className="text-gray-400 font-bold">No hay ventas pendientes de facturar.</p>
                       <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Todas las ventas están facturadas o canceladas.</p>
                    </td>
                  </tr>
                ) : (
                  pendingSales.map(sale => (
                    <tr key={sale.id} className={`group hover:bg-primary-50/30 transition-all cursor-pointer ${selectedSales.includes(sale.id) ? 'bg-primary-50/50' : ''}`} onClick={() => toggleSaleSelection(sale)}>
                      <td className="px-6 py-5">
                        {selectedSales.includes(sale.id) ? (
                          <CheckSquare className="text-primary-600" size={20} />
                        ) : (
                          <Square className="text-gray-300 group-hover:text-primary-400" size={20} />
                        )}
                      </td>
                      <td className="px-6 py-5 font-black text-primary-600">{sale.folio}</td>
                      <td className="px-6 py-5">
                         <p className="font-bold text-gray-900">{sale.customer?.name}</p>
                         <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{sale.customer?.id.slice(0,8)}</p>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-900">
                         ${((sale.total_amount || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-xs font-bold">
                         {new Date(sale.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 text-right">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${sale.status === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                           {sale.status === 'PAID' ? 'Liquidado' : 'Pendiente'}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
           <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">UUID / Folio Fiscal</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ventas Ref.</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Total</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Timbrado</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.length === 0 ? (
                  <tr><td colSpan="6" className="py-20 text-center text-gray-400 font-bold">No hay historial de CFDI.</td></tr>
                ) : (
                  history.map(cfdi => (
                    <tr key={cfdi.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${cfdi.type === 'I' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                           {cfdi.type === 'I' ? 'Ingreso' : 'Egreso'}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <p className="font-mono text-[11px] font-bold text-gray-500">{cfdi.uuid}</p>
                         {cfdi.status === 'CANCELADO' && <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Cancelado SAT</span>}
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex -space-x-2">
                            {cfdi.sales?.map((s, i) => (
                              <div key={s.id} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-500" title={s.folio}>
                                {s.folio.slice(-2)}
                              </div>
                            ))}
                         </div>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-900">
                         ${(cfdi.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-xs font-bold">
                         {new Date(cfdi.created_at).toLocaleString('es-MX')}
                      </td>
                      <td className="px-6 py-5 text-right space-x-2">
                         <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Descargar XML"><Download size={18} /></button>
                         <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Descargar PDF"><FileText size={18} /></button>
                         {cfdi.status !== 'CANCELADO' && cfdi.status !== 'CANCELADO (NC)' && cfdi.type !== 'E' && (
                           <>
                             <button 
                               onClick={() => { setSelectedCfdi(cfdi); setIsCancelModalOpen(true); }}
                               className="p-2 text-gray-400 hover:text-red-500 transition-colors" 
                               title="Cancelar (Emitir Nota de Crédito)"
                             >
                               <Trash2 size={18} />
                             </button>
                           </>
                         )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
           </table>
        </div>
      )}

      {/* Modals are unchanged but using apiClient now */}
      {isBillingModalOpen && successData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner">
                 <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">¡Factura Exitosa!</h2>
              <p className="text-gray-500 font-medium mb-8">El comprobante fiscal ha sido timbrado correctamente y está disponible para descarga.</p>
              
              <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100 text-left">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Folio Fiscal (UUID)</p>
                 <p className="font-mono text-xs font-bold text-gray-700 break-all">{successData.uuid}</p>
                 <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</p>
                      <p className="font-black text-gray-900">${(successData.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Total</p>
                      <p className="font-black text-primary-600 text-xl">${(successData.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="flex items-center justify-center space-x-2 py-4 bg-gray-100 rounded-2xl font-black text-gray-700 hover:bg-gray-200 transition-all">
                    <Download size={18} />
                    <span>XML</span>
                 </button>
                 <button className="flex items-center justify-center space-x-2 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all">
                    <FileText size={18} />
                    <span>PDF</span>
                 </button>
              </div>
              
              <button onClick={() => setIsBillingModalOpen(false)} className="mt-6 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-[10px] tracking-widest">Cerrar Ventana</button>
           </div>
        </div>
      )}

      {isCancelModalOpen && selectedCfdi && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center space-x-4 mb-6">
                 <div className="bg-red-50 p-3 rounded-2xl text-red-500">
                    <AlertTriangle size={24} />
                 </div>
                 <h2 className="text-xl font-black text-gray-900">Emitir Nota de Crédito</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6 font-medium">Estás a punto de cancelar la factura <span className="font-mono font-bold text-gray-800">{selectedCfdi.uuid.slice(0, 12)}...</span>. Esto generará automáticamente un CFDI de Egreso (Nota de Crédito) para saldar el movimiento.</p>
              <div className="space-y-4 mb-8">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivo de Cancelación (SAT)</label>
                 {['01', '02', '03', '04'].map(m => (
                   <button key={m} onClick={() => handleCancelInvoice(m)} className="w-full text-left p-4 rounded-xl border border-gray-100 hover:bg-red-50 transition-all flex justify-between items-center">
                     <span className="text-sm font-bold">Motivo {m}</span>
                     <ArrowRight size={16} />
                   </button>
                 ))}
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className="w-full py-2 text-gray-400 text-xs font-bold uppercase">Cancelar Operación</button>
           </div>
        </div>
      )}

    </div>
  );
}
