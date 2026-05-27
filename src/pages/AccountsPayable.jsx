import React, { useState, useEffect } from 'react'
import { 
  Wallet, Receipt, History, CheckCircle2, AlertCircle, 
  Search, ArrowUpRight, Ban, CreditCard, Banknote,
  Calendar, FileText, ChevronRight, User, Hash, Info,
  Filter, Landmark, MoreHorizontal, DollarSign, RefreshCw, Trash2, X, RotateCcw,
  ChevronLeft
} from 'lucide-react'
import axios from 'axios'

const AccountsPayable = () => {
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Por Validar') // Por Validar, Pendiente, Pagado
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [transactions, setTransactions] = useState([])
  
  // Action states
  const [validationAmount, setValidationAmount] = useState(0)
  const [payAmount, setPayAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Transferencia')
  const [paymentRef, setPaymentRef] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchPayments = async (page = 1, status = activeTab) => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/api/cp/payments?page=${page}&limit=50&status=${status}`, getHeaders())
      setPayments(res.data.data || [])
      setMeta(res.data.meta || { total: 0, page: 1, limit: 50, totalPages: 1 })
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments(currentPage, activeTab)
  }, [currentPage, activeTab])

  const handleOpenValidation = (payment) => {
    setSelectedPayment(payment)
    setValidationAmount(payment.reception_value || 0)
    setIsValidationModalOpen(true)
  }

  const handleOpenPayment = (payment) => {
    setSelectedPayment(payment)
    setPayAmount(payment.balance || 0)
    setIsPaymentModalOpen(true)
  }

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment)
    setIsDetailModalOpen(true)
  }

  const handleViewHistory = async (payment) => {
    setSelectedPayment(payment)
    try {
        const res = await axios.get(`${apiUrl}/api/cp/payments/${payment.id}/transactions`, getHeaders())
        setTransactions(res.data)
        setIsHistoryModalOpen(true)
    } catch (error) {
        console.error('Error fetching transactions:', error)
    }
  }

  const confirmValidation = async () => {
    try {
        await axios.put(`${apiUrl}/api/cp/payments/${selectedPayment.id}/validate`, {
            amount: parseFloat(validationAmount)
        }, getHeaders())
        setIsValidationModalOpen(false)
        fetchPayments(currentPage, activeTab)
    } catch (error) {
        alert(error.response?.data?.error || 'Error al validar monto')
    }
  }

  const confirmPayment = async () => {
    try {
        await axios.post(`${apiUrl}/api/cp/payments/${selectedPayment.id}/transaction`, {
            amount: parseFloat(payAmount),
            payment_method: paymentMethod,
            reference: paymentRef
        }, getHeaders())
        setIsPaymentModalOpen(false)
        setPaymentRef('')
        fetchPayments(currentPage, activeTab)
    } catch (error) {
        alert(error.response?.data?.error || 'Error al registrar pago')
    }
  }

  const handleRevertValidation = async (id) => {
    if (!window.confirm('¿Estás seguro de revertir la validación?')) return
    try {
        await axios.put(`${apiUrl}/api/cp/payments/${id}/revert-validation`, {}, getHeaders())
        fetchPayments(currentPage, activeTab)
    } catch (error) {
        alert(error.response?.data?.error || 'Error al revertir')
    }
  }

  const handleCancelTransaction = async (txId) => {
    if (!window.confirm('¿Deseas cancelar este pago?')) return
    try {
        await axios.delete(`${apiUrl}/api/cp/transactions/${txId}`, getHeaders())
        setIsHistoryModalOpen(false)
        fetchPayments(currentPage, activeTab)
    } catch (error) {
        alert(error.response?.data?.error || 'Error al cancelar pago')
    }
  }

  const filteredData = payments.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        (p.supplier?.name || '').toLowerCase().includes(searchLower) || 
        (p.reception?.purchase_order?.folio || '').toLowerCase().includes(searchLower);
    return matchesSearch;
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200">
               <Wallet size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Cuentas por Pagar</h2>
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest italic">Sistema Nuevo | {meta.total} Registros</p>
            </div>
         </div>

         <div className="flex items-center space-x-3">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Proveedor o Folio..."
                 className="pl-12 pr-6 py-3 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-600 w-64 font-bold text-gray-700 transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <button onClick={() => fetchPayments(currentPage, activeTab)} className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all">
                <RefreshCw size={20} />
            </button>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white border border-gray-100 rounded-2xl w-fit shadow-sm">
         {['Por Validar', 'Pendiente', 'Pagado'].map(tab => (
           <button 
             key={tab}
             onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
             className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* List Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proveedor / Folio OC</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha Rec.</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {loading ? (
                 <tr><td colSpan="5" className="text-center py-20 animate-pulse font-bold text-gray-400">Cargando cuentas...</td></tr>
               ) : filteredData.length === 0 ? (
                 <tr><td colSpan="5" className="text-center py-20 font-bold text-gray-400 italic">No hay registros en esta sección</td></tr>
               ) : filteredData.map(p => (
                 <tr key={p.id} className="hover:bg-gray-50/50 group transition-all">
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="font-black text-gray-900 tracking-tighter uppercase">{p.supplier?.name || 'Proveedor Desconocido'}</span>
                          <span className="text-xs font-bold text-primary-600 text-mono">OC: {p.reception?.purchase_order?.folio || 'N/A'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-gray-500">
                       {p.reception?.created_at ? new Date(p.reception.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-gray-900">
                       ${((activeTab === 'Por Validar' ? p.reception_value : p.amount) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-red-600">
                       ${(p.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-right flex items-center justify-end space-x-2">
                       <button onClick={() => handleViewDetails(p)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Ver Cantidades Recibidas">
                          <Receipt size={18} />
                       </button>
                       {activeTab === 'Por Validar' && (
                          <button 
                            onClick={() => handleOpenValidation(p)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all"
                          >
                             <CheckCircle2 size={14} />
                             <span>Validar</span>
                          </button>
                       )}
                       {activeTab === 'Pendiente' && (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => handleRevertValidation(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Revertir Validación">
                                <RotateCcw size={18} />
                            </button>
                            <button 
                                onClick={() => handleOpenPayment(p)}
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all"
                            >
                                <Banknote size={14} />
                                <span>Pagar</span>
                            </button>
                          </div>
                       )}
                       {activeTab === 'Pagado' && (
                          <button 
                            onClick={() => handleViewHistory(p)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                          >
                             <History size={14} />
                             <span>Historial</span>
                          </button>
                       )}
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>

         {/* Pagination Controls */}
         {meta.totalPages > 1 && (
           <div className="p-8 border-t border-gray-100 flex items-center justify-center space-x-4">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all"
              >
                 <ChevronLeft size={20} />
              </button>
              <div className="flex items-center space-x-2">
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Página</span>
                 <span className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-black text-sm">{currentPage}</span>
                 <span className="text-xs font-black text-gray-400 uppercase tracking-widest">de {meta.totalPages}</span>
              </div>
              <button 
                disabled={currentPage === meta.totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-gray-50 transition-all"
              >
                 <ChevronRight size={20} />
              </button>
           </div>
         )}
      </div>

      {/* VALIDATION MODAL */}
      {isValidationModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 tracking-tighter">Validar Monto para Pago</h3>
                 <button onClick={() => setIsValidationModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={20}/></button>
              </div>

              <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Físico Recibido</p>
                        <p className="text-xl font-black text-gray-900">${(selectedPayment?.reception_value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                     </div>
                     <div className="p-4 bg-white border border-gray-100 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Orden Compra</p>
                        <p className="text-xl font-black text-primary-600">${(selectedPayment?.po_total_value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                     </div>
                  </div>

                 <div className="space-y-3 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <label className="text-sm font-black text-gray-900">Monto Final a Validar (Factura)</label>
                    <div className="relative">
                        <DollarSign size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" />
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-6 py-5 bg-white rounded-2xl border border-gray-200 focus:border-primary-600 outline-none font-black text-3xl text-gray-900 transition-all text-right"
                            value={validationAmount}
                            onChange={(e) => setValidationAmount(e.target.value)}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold italic text-center px-4">
                        * Ingrese el total de la factura o el valor validado por contabilidad para programar el pago.
                    </p>
                 </div>

                 <button 
                   onClick={confirmValidation}
                   className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-sm tracking-tighter shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all"
                 >
                    Confirmar y Programar Pago
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* RECEPTION DETAIL MODAL */}
      {isDetailModalOpen && selectedPayment && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Detalle de Recepción</h3>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">OC: {selectedPayment.reception?.purchase_order?.folio}</p>
                  </div>
                  <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={20}/></button>
               </div>

               <div className="p-8 overflow-y-auto flex-1">
                  <div className="bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-white/50 border-b border-gray-100">
                           <tr>
                              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Producto</th>
                              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cant. Recibida</th>
                              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Costo Unit.</th>
                              <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Físico</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {(selectedPayment.reception?.items || []).map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/50 transition-colors">
                                 <td className="px-5 py-4">
                                    <p className="font-bold text-gray-900 text-sm">{item.product?.name || 'Producto Desconocido'}</p>
                                    <p className="text-[10px] text-gray-400 font-mono italic">{item.product?.legacy_code || 'S/N'}</p>
                                 </td>
                                 <td className="px-5 py-4 text-right">
                                    <span className="inline-block px-3 py-1 bg-white border border-gray-100 rounded-lg font-black text-gray-700">{item.quantity}</span>
                                 </td>
                                 <td className="px-5 py-4 text-right text-gray-500 text-sm">${(item.cost || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                 <td className="px-5 py-4 text-right font-black text-primary-600">${((item.quantity || 0) * (item.cost || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              </tr>
                           ))}
                        </tbody>
                        <tfoot className="bg-gray-50/80 border-t border-gray-100">
                           <tr>
                              <td colSpan="3" className="px-5 py-4 text-right font-black text-gray-900 text-xs uppercase tracking-widest flex flex-col items-end">
                                 <span>Subtotal de Recepción</span>
                                 <span className="text-[9px] text-primary-600 normal-case font-bold mt-0.5 italic">Basado en conteo físico de almacén</span>
                              </td>
                              <td className="px-5 py-4 text-right font-black text-primary-700 text-xl tracking-tighter">
                                 ${(selectedPayment.reception?.items || []).reduce((acc, i) => acc + (i.quantity * i.cost), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                           </tr>
                        </tfoot>
                     </table>
                  </div>
                  
                  {selectedPayment.reception?.observations && (
                    <div className="mt-6 p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-start space-x-3">
                       <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Info size={20} /></div>
                       <div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">Observaciones del Receptora</p>
                          <p className="text-sm font-bold text-orange-900 leading-relaxed">"{selectedPayment.reception.observations}"</p>
                       </div>
                    </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-8 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-primary-900 tracking-tighter">Registrar Pago</h3>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{selectedPayment.supplier?.name}</p>
                 </div>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm"><X size={18} /></button>
              </div>

              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto a Pagar</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-black text-2xl text-gray-900 focus:bg-white transition-all ring-1 ring-gray-100 focus:ring-primary-500/20"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Método</label>
                       <select 
                         className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none font-bold text-gray-700 appearance-none"
                         value={paymentMethod}
                         onChange={(e) => setPaymentMethod(e.target.value)}
                       >
                          <option>Transferencia</option>
                          <option>Efectivo</option>
                          <option>Cheque</option>
                          <option>Tarjeta</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Referencia</label>
                       <input 
                         className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none font-bold text-gray-700"
                         placeholder="Opcional"
                         value={paymentRef}
                         onChange={(e) => setPaymentRef(e.target.value)}
                       />
                    </div>
                 </div>

                 <button onClick={confirmPayment} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-sm tracking-tight shadow-xl hover:bg-primary-700 transition-all transform active:scale-95 mt-4">
                    Confirmar Pago / Abono
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-xl font-black text-gray-900 tracking-tighter">Historial de Pagos</h3>
                 <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors"><X size={20}/></button>
              </div>

              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                 {transactions.length === 0 ? (
                    <p className="text-center py-10 text-gray-400 font-bold italic">No se han registrado abonos aún.</p>
                 ) : transactions.map(tx => (
                    <div key={tx.id} className={`p-4 rounded-2xl border ${tx.status === 'Cancelado' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleDateString()}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tx.status === 'Cancelado' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                             {tx.status}
                          </span>
                       </div>
                       <div className="flex items-center justify-between">
                          <div>
                             <p className="font-black text-gray-900 text-lg">${(tx.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                             <p className="text-xs font-bold text-gray-500 capitalize">{tx.payment_method}</p>
                          </div>
                          {tx.status !== 'Cancelado' && (
                             <button 
                               onClick={() => handleCancelTransaction(tx.id)}
                               className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                               title="Cancelar Transacción"
                             >
                                <Trash2 size={16} />
                             </button>
                          )}
                       </div>
                       {tx.reference && <p className="mt-2 text-[10px] font-mono text-gray-400 bg-gray-50 p-1 rounded inline-block">Ref: {tx.reference}</p>}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default AccountsPayable
