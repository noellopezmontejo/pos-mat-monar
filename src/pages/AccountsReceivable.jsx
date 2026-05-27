import React, { useState, useEffect } from 'react'
import { 
  CreditCard, Receipt, History, CheckCircle2, AlertCircle, 
  Search, ArrowUpRight, Ban, Wallet, Banknote,
  Calendar, FileText, ChevronRight, User, Hash, Info,
  Filter, Landmark, MoreHorizontal, DollarSign, RefreshCw, Trash2, X,
  ChevronLeft, Package, Eye, ShieldCheck, Lock, Unlock, Clock, AlertTriangle,
  CheckSquare, Square, Printer
} from 'lucide-react'
import axios from 'axios'
import { PrintableTicket } from '../components/ThermalTicket'
import { useCompany } from '../contexts/CompanyContext'

const STATUS_MAP = {
  PENDING: { label: 'Pendiente', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  PENDIENTE: { label: 'Pendiente', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  PENDIENTE_COBRO: { label: 'Pendiente Cobro', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  COBRADO_CHOFER: { label: 'Cobrado Chofer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PAID: { label: 'Pagado', color: 'bg-green-50 text-green-600 border-green-200' },
  PAGADO: { label: 'Pagado', color: 'bg-green-50 text-green-600 border-green-200' },
  LIQUIDADO: { label: 'Liquidado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const AccountsReceivable = () => {
  const { profile } = useCompany()
  const [receivables, setReceivables] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Pendiente')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  
  const [selectedSalesIds, setSelectedSalesIds] = useState([])
  const [isBulkMode, setIsBulkMode] = useState(false)

  const [payAmount, setPayAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [paymentRef, setPaymentRef] = useState('')

  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [isSessionOpenModal, setIsSessionOpenModal] = useState(false)
  const [isSessionCutModal, setIsSessionCutModal] = useState(false)
  const [openBalance, setOpenBalance] = useState('')
  const [cutData, setCutData] = useState(null)
  const [countedCash, setCountedCash] = useState('')
  const [cutNotes, setCutNotes] = useState('')

  const [printData, setPrintData] = useState(null)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchReceivables = async (page = 1, status = activeTab) => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/api/receivables?page=${page}&limit=50&status=${status}`, getHeaders())
      setReceivables(res.data.data || [])
      setMeta(res.data.meta || { total: 0, page: 1, limit: 50, totalPages: 1 })
    } catch (error) { console.error(error) }
    finally { setLoading(false) }
  }

  const fetchSession = async () => {
    setSessionLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/api/cash-register/current`, getHeaders())
      setSession(res.data)
    } catch (error) { setSession(null) }
    finally { setSessionLoading(false) }
  }

  useEffect(() => {
    fetchSession()
    fetchReceivables(currentPage, activeTab)
  }, [currentPage, activeTab])

  const handlePrint = () => {
    if (window.electronAPI && window.electronAPI.send) {
      window.electronAPI.send('print-direct')
    } else {
      window.print()
    }
  }

  const triggerReprint = async (sale, type) => {
    setIsPrinting(true)
    
    let fullSale = sale
    if (!sale.items || sale.items.length === 0) {
      try {
        const res = await axios.get(`${apiUrl}/api/receivables/detail/${sale.id}`, getHeaders())
        fullSale = res.data
      } catch (e) { console.error('Error loading detail for print', e) }
    }

    setPrintData({ sale: fullSale, type })
    
    setTimeout(() => {
      handlePrint()
      if (type !== 'SUCCESS_MODAL') {
        setTimeout(() => {
          setPrintData(null)
          setIsPrinting(false)
        }, 1500)
      }
    }, 1200)
  }

  const handleOpenSession = async () => {
    try {
      const res = await axios.post(`${apiUrl}/api/cash-register/open`, { opening_balance: openBalance || 0 }, getHeaders())
      setSession(res.data); setIsSessionOpenModal(false); setOpenBalance('');
    } catch (error) { alert(error.response?.data?.error || 'Error al abrir caja') }
  }

  const handleLoadCutData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/cash-register/cut`, getHeaders())
      setCutData(res.data.totals); setIsSessionCutModal(true);
    } catch (error) { alert(error.response?.data?.error || 'Error al calcular corte') }
  }

  const handleCloseSession = async () => {
    try {
      await axios.post(`${apiUrl}/api/cash-register/close`, { closing_balance: countedCash, expected_balance: cutData?.expected_cash, notes: cutNotes }, getHeaders())
      setIsSessionCutModal(false); setSession(null); setCutData(null); setCountedCash(''); setCutNotes('');
      alert('Caja cerrada con éxito')
    } catch (error) { alert(error.response?.data?.error || 'Error al cerrar caja') }
  }

  const handleOpenPayment = (sale) => {
    setSelectedSale(sale)
    setPayAmount(((sale.total_amount || 0) / 100).toFixed(2))
    setIsPaymentModalOpen(true)
  }

  const handleOpenDetail = (sale) => {
    setSelectedSale(sale)
    setIsDetailModalOpen(true)
  }

  const confirmPayment = async () => {
    if (!selectedSale) return
    try {
        const res = await axios.post(`${apiUrl}/api/receivables/payment`, { saleId: selectedSale.id, amount: parseFloat(payAmount), method: paymentMethod, reference: paymentRef }, getHeaders())
        const updatedSale = res.data.sale || selectedSale
        setIsPaymentModalOpen(false); setPaymentRef(''); fetchReceivables(currentPage, activeTab)
        setPrintData({ sale: updatedSale, type: 'SUCCESS_MODAL' })
        setShowPaidModal(true)
    } catch (error) { alert(error.response?.data?.error || 'Error al registrar pago') }
  }

  const handleCancelSale = async (sale) => {
    if (!window.confirm(`¿Estás seguro de cancelar la venta ${sale.folio}?`)) return
    try {
      await axios.post(`${apiUrl}/api/receivables/cancel`, { saleId: sale.id }, getHeaders())
      alert('Venta cancelada exitosamente.'); fetchReceivables(currentPage, activeTab)
    } catch (error) { alert(error.response?.data?.error || 'Error al cancelar') }
  }

  const handleBulkPayment = async () => {
    try {
      await axios.post(`${apiUrl}/api/receivables/bulk-payment`, { saleIds: selectedSalesIds, method: paymentMethod, reference: paymentRef }, getHeaders())
      setIsPaymentModalOpen(false); setPaymentRef(''); setSelectedSalesIds([]); setIsBulkMode(false); fetchReceivables(currentPage, activeTab)
      alert('Cobro múltiple realizado')
    } catch (error) { alert(error.response?.data?.error || 'Error en cobro múltiple') }
  }

  const handleBulkCancel = async () => {
    if (!window.confirm(`¿Estás seguro de cancelar ${selectedSalesIds.length} ventas?`)) return
    try {
      await axios.post(`${apiUrl}/api/receivables/bulk-cancel`, { saleIds: selectedSalesIds }, getHeaders())
      alert('Ventas canceladas.'); setSelectedSalesIds([]); fetchReceivables(currentPage, activeTab)
    } catch (error) { alert(error.response?.data?.error || 'Error en cancelación múltiple') }
  }

  const toggleSelection = (id) => setSelectedSalesIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleAll = () => {
    const collectable = filteredData.filter(r => canCollect(r.status))
    if (selectedSalesIds.length === collectable.length) { setSelectedSalesIds([]) } 
    else { setSelectedSalesIds(collectable.map(r => r.id)) }
  }

  const filteredData = receivables.filter(r => {
    const customerName = (r.customer?.name || '').toLowerCase();
    const folio = (r.folio || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    return customerName.includes(searchTermLower) || folio.includes(searchTermLower);
  })

  const getStatusBadge = (status) => {
    const cfg = STATUS_MAP[(status || '').toUpperCase()] || { label: status || 'Desconocido', color: 'bg-gray-50 text-gray-600 border-gray-200' }
    return <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>{cfg.label}</span>
  }

  const canCollect = (status) => {
    const s = (status || '').toUpperCase()
    return s.includes('PENDING') || s.includes('PENDIENTE') || s === 'COBRADO_CHOFER'
  }

  const currentDebt = (isBulkMode 
    ? receivables.filter(r => selectedSalesIds.includes(r.id)).reduce((acc, curr) => acc + (curr.total_amount || 0), 0) 
    : (selectedSale?.total_amount || 0)
  ) / 100

  if (sessionLoading) return <div className="p-20 text-center animate-pulse text-gray-400 font-bold">Verificando estado de caja...</div>

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-red-100"><Lock size={48} /></div>
        <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Caja Cerrada</h2>
        <p className="text-gray-500 font-bold mb-10 text-center max-w-sm">Abre tu caja para iniciar tu turno y realizar cobros.</p>
        <button onClick={() => setIsSessionOpenModal(true)} className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 active:scale-95"><Unlock size={24} /> Aperturar Caja</button>
        {isSessionOpenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-gray-900 tracking-tighter">Fondo de Caja</h3><button onClick={() => setIsSessionOpenModal(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={18} /></button></div>
                <div className="space-y-4"><label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Efectivo Inicial</label><input type="number" className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl text-gray-900 ring-1 ring-gray-100 focus:ring-primary-500/20" placeholder="0.00" value={openBalance} onChange={(e) => setOpenBalance(e.target.value)} /></div>
                <button onClick={handleOpenSession} className="w-full mt-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm tracking-tight shadow-xl hover:bg-primary-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"><Unlock size={18}/> Iniciar Turno</button>
             </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Contenedor de impresión aislado */}
      <div className="print-only">
        {printData && (
            <PrintableTicket 
              sale={printData.sale} 
              items={(printData.sale.items || []).map(item => ({ quantity: item.quantity, price: item.price || 0, product: item.product }))} 
              company={profile} 
              type={printData.type === 'SUCCESS_MODAL' ? 'REMISION_FULL' : printData.type} 
            />
        )}
      </div>

      {isPrinting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md animate-in fade-in duration-300 no-print">
           <div className="w-20 h-20 border-8 border-primary-600 border-t-transparent rounded-full animate-spin mb-6 shadow-2xl"></div>
           <p className="font-black text-2xl text-primary-900 uppercase tracking-[0.2em] animate-pulse">Generando Ticket...</p>
        </div>
      )}

      <div className="space-y-6 no-print">
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center space-x-4"><div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200"><Landmark size={28} /></div><div><h2 className="text-2xl font-black text-gray-900 tracking-tighter">Caja / Cobros</h2><p className="text-gray-400 font-bold text-xs uppercase tracking-widest italic">Caja Principal | {meta.total} Registros</p></div></div>
           <div className="flex items-center space-x-3">
              {session?.force_close && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-pulse">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Corte Pendiente del día anterior</span>
                </div>
              )}
              <div className="relative hidden md:block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Buscar..." className="pl-12 pr-6 py-3 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-600 w-64 font-bold text-gray-700 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button onClick={() => fetchReceivables(currentPage, activeTab)} className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all"><RefreshCw size={20} /></button>
              <button 
                onClick={handleLoadCutData} 
                className={`px-5 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border ${session?.force_close ? 'bg-red-600 text-white border-red-700 animate-bounce' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
              >
                <Lock size={16}/> Corte de Caja {session?.force_close ? 'OBLIGATORIO' : ''}
              </button>
           </div>
        </div>

        <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl w-fit shadow-sm">
           {['Por Validar', 'Pendiente', 'Pagado'].map(tab => (<button key={tab} onClick={() => { setActiveTab(tab); setCurrentPage(1); }} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>{tab}</button>))}
        </div>

        {selectedSalesIds.length > 0 && (
          <div className="bg-primary-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4"><span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black">{selectedSalesIds.length}</span><span className="font-bold text-sm tracking-widest uppercase">Seleccionadas</span></div>
             <div className="flex items-center gap-3">
                <button onClick={handleBulkCancel} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"><Trash2 size={14}/> Cancelar Múltiples</button>
                <button onClick={() => { 
                  const selectedSalesObjects = receivables.filter(r => selectedSalesIds.includes(r.id)); const total = selectedSalesObjects.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
                  setPayAmount((total / 100).toFixed(2)); setIsBulkMode(true); setIsPaymentModalOpen(true); 
                }} className="px-4 py-2 bg-white text-primary-900 rounded-xl text-xs font-black shadow-lg hover:bg-gray-100 transition-all flex items-center gap-2"><DollarSign size={14}/> Cobrar Múltiples</button>
             </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
           <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                 <tr>
                    <th className="px-6 py-5 w-12 text-center">{filteredData.filter(r => canCollect(r.status)).length > 0 && (<button onClick={toggleAll} className="text-gray-400 hover:text-primary-600">{selectedSalesIds.length > 0 && selectedSalesIds.length === filteredData.filter(r => canCollect(r.status)).length ? <CheckSquare size={18}/> : <Square size={18}/>}</button>)}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Folio / Cliente</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estatus</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {loading ? (<tr><td colSpan="6" className="text-center py-20 animate-pulse font-bold text-gray-400">Cargando...</td></tr>) : filteredData.length === 0 ? (<tr><td colSpan="6" className="text-center py-20 font-bold text-gray-400 italic">No hay registros</td></tr>) : filteredData.map(r => (
                   <tr key={r.id} className={`hover:bg-gray-50/50 group transition-all ${selectedSalesIds.includes(r.id) ? 'bg-primary-50/30' : ''}`}>
                      <td className="px-6 py-5 text-center">{canCollect(r.status) && (<button onClick={() => toggleSelection(r.id)} className={`${selectedSalesIds.includes(r.id) ? 'text-primary-600' : 'text-gray-300 hover:text-gray-400'}`}>{selectedSalesIds.includes(r.id) ? <CheckSquare size={18}/> : <Square size={18}/>}</button>)}</td>
                      <td className="px-8 py-5 flex flex-col"><span className="font-black text-gray-900 tracking-tighter uppercase">{r.folio || 'S/F'}</span><span className="text-sm font-bold text-primary-600 uppercase">{r.customer?.name || 'Cliente'}</span></td>
                      <td className="px-8 py-5 text-sm font-bold text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-8 py-5 text-right font-black text-gray-900">${((r.total_amount || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-8 py-5 text-center">{getStatusBadge(r.status)}</td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex items-center gap-2 justify-end">
                            {(r.status || '').toUpperCase() === 'PAID' || (r.status || '').toUpperCase() === 'PAGADO' || (r.status || '').toUpperCase() === 'LIQUIDADO' ? (
                               <button onClick={() => triggerReprint(r, 'REMISION_FULL')} className="p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all" title="Reimprimir Ticket de Venta (3 Copias)"><Printer size={16} /></button>
                            ) : (
                               <button onClick={() => triggerReprint(r, 'REMISION_SHORT')} className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all" title="Reimprimir Pase a Caja"><Printer size={16} /></button>
                            )}
                            <button onClick={() => handleOpenDetail(r)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"><Eye size={14} /></button>
                            {canCollect(r.status) && (
                               <>
                                 <button onClick={() => handleCancelSale(r)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black hover:bg-red-100 transition-all ml-1"><Trash2 size={14} /></button>
                                 <button 
                                   onClick={() => handleOpenPayment(r)} 
                                   disabled={session?.force_close}
                                   className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all ml-2 flex items-center gap-2 ${session?.force_close ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                                 >
                                   <DollarSign size={14} /> <span>Cobrar</span>
                                 </button>
                               </>
                            )}
                         </div>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {isDetailModalOpen && selectedSale && !isBulkMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200 no-print">
             <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                <div className="p-8 pb-5 border-b border-gray-100 flex items-center justify-between">
                   <div><div className="flex items-center gap-3 mb-1"><h3 className="text-xl font-black text-gray-900 tracking-tighter">{selectedSale.folio}</h3>{getStatusBadge(selectedSale.status)}</div><p className="text-sm font-bold text-primary-600 uppercase">{selectedSale.customer?.name}</p></div>
                   <button onClick={() => setIsDetailModalOpen(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={18} /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-8 pt-5 space-y-2">
                   {(selectedSale.items || []).map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center"><Package size={18} className="text-primary-600"/></div><div><p className="font-bold text-gray-900 text-sm uppercase">{item.product?.name}</p><p className="text-[10px] text-gray-400 font-bold">{item.product?.legacy_code}</p></div></div>
                        <div className="text-right"><p className="font-black text-gray-900">×{item.quantity}</p><p className="text-xs font-black text-primary-600">${((item.quantity * (item.price || 0)) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p></div>
                     </div>
                   ))}
                </div>
                <div className="p-8 pt-5 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
                   <div className="flex-grow">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total de Venta</span>
                      <span className="text-3xl font-black text-gray-900">${((selectedSale.total_amount || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => triggerReprint(selectedSale, 'REMISION_SHORT')} className="p-4 bg-orange-100 text-orange-600 rounded-2xl hover:bg-orange-200 transition-all shadow-sm" title="Reimprimir Pase a Caja"><Printer size={24}/></button>
                      {((selectedSale.status || '').toUpperCase() === 'PAGADO' || (selectedSale.status || '').toUpperCase() === 'LIQUIDADO' || (selectedSale.status || '').toUpperCase() === 'PAID') && (
                        <button onClick={() => triggerReprint(selectedSale, 'REMISION_FULL')} className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg" title="Reimprimir Ticket de Venta (3 Copias)"><Printer size={24}/></button>
                      )}
                      {canCollect(selectedSale.status) && (<button onClick={() => { setIsDetailModalOpen(false); handleOpenPayment(selectedSale) }} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"><DollarSign size={18}/> Cobrar ahora</button>)}
                   </div>
                </div>
             </div>
          </div>
        )}

        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200 no-print">
             <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-8 bg-primary-50 border-b border-primary-100 flex items-center justify-between"><div><h3 className="text-xl font-black text-primary-900 tracking-tighter">{isBulkMode ? `Cobro Múltiple` : `Registrar Pago: ${selectedSale?.folio}`}</h3><p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{isBulkMode ? 'Selección Múltiple' : selectedSale?.customer?.name}</p></div><button onClick={() => { setIsPaymentModalOpen(false); setIsBulkMode(false); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"><X size={18} /></button></div>
                <div className="p-8 space-y-5">
                   <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deuda Total</p><p className="text-2xl font-black text-gray-900">${currentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p></div><div className="text-right"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas</p><p className="text-lg font-black text-primary-600">{isBulkMode ? `${selectedSalesIds.length}` : `1`}</p></div></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Monto Entregado</label><input type="number" className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></div>
                   <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Método</label><select className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none font-bold" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option></select></div><div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Referencia</label><input className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none font-bold" placeholder="Opcional" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} /></div></div>
                   {parseFloat(payAmount) > currentDebt && (<div className="p-6 bg-green-600 text-white rounded-3xl flex items-center justify-between animate-in zoom-in-95"><div><p className="text-[10px] font-black uppercase opacity-80">Cambio a Entregar</p><p className="text-4xl font-black">${(parseFloat(payAmount) - currentDebt).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p></div><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"><Banknote size={32} /></div></div>)}
                   <button onClick={isBulkMode ? handleBulkPayment : confirmPayment} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={18}/> Confirmar Liquidación</button>
                </div>
             </div>
          </div>
        )}

        {showPaidModal && printData && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">¡Cobro Exitoso!</h2>
              <p className="text-gray-500 font-bold mb-8">Folio: {printData.sale.folio}</p>
              <div className="space-y-3">
                 <button onClick={handlePrint} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors shadow-lg"><Printer size={24} /> IMPRIMIR 3 COPIAS</button>
                 <button onClick={() => { setShowPaidModal(false); setPrintData(null); }} className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-200 transition-colors mt-2">CERRAR</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Corte de Caja */}
        {isSessionCutModal && cutData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200 no-print">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-red-50/30">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Lock size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Corte de Caja</h3>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Resumen de Turno</p>
                    </div>
                  </div>
                  <button onClick={() => setIsSessionCutModal(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"><X size={18} /></button>
               </div>
               
               <div className="flex-grow overflow-y-auto p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fondo Inicial</p>
                        <p className="text-2xl font-black text-gray-900">${(cutData.opening_balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                     </div>
                     <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100">
                        <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Ventas en Efectivo</p>
                        <p className="text-2xl font-black text-primary-600">${(cutData.cash || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Desglose de otros métodos</p>
                     <div className="grid grid-cols-3 gap-3">
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tarjeta</p>
                           <p className="font-black text-gray-700">${(cutData.card || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Transferencia</p>
                           <p className="font-black text-gray-700">${(cutData.transfer || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Otros</p>
                           <p className="font-black text-gray-700">${(cutData.other || 0).toLocaleString()}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote size={120} /></div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Efectivo Esperado en Caja</p>
                        <p className="text-5xl font-black">${(cutData.expected_cash || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Efectivo Contado en Caja (Real)</label>
                        <input 
                           type="number" 
                           className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl text-primary-600 focus:ring-2 ring-primary-500/20" 
                           placeholder="0.00"
                           value={countedCash}
                           onChange={(e) => setCountedCash(e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notas del Corte</label>
                        <textarea 
                           className="w-full px-4 py-3 bg-gray-50 rounded-2xl outline-none font-bold text-sm h-20 resize-none" 
                           placeholder="Observaciones..."
                           value={cutNotes}
                           onChange={(e) => setCutNotes(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                  <button onClick={() => setIsSessionCutModal(false)} className="flex-1 py-4 bg-white text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all">Cancelar</button>
                  <button onClick={handleCloseSession} className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                     <ShieldCheck size={18} /> Finalizar Turno y Cerrar Caja
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AccountsReceivable
