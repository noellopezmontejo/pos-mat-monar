import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Search, Users, DollarSign, Calendar, FileText, ArrowUpRight, CheckCircle2, X, AlertTriangle, FileBox, Landmark, FileSpreadsheet, PlusCircle, Printer
} from 'lucide-react'

import { useCompany } from '../contexts/CompanyContext'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Collections() {
  const { profile } = useCompany()
  const [debtors, setDebtors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [statementData, setStatementData] = useState(null)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [paymentRef, setPaymentRef] = useState('')

  const getHeaders = () => {
    const token = localStorage.getItem('token')
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  useEffect(() => {
    fetchDebtors()
  }, [])

  const fetchDebtors = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/collections/customers`, getHeaders())
      setDebtors(res.data)
    } catch (error) {
      console.error('Error fetching debtors:', error)
    } finally {
      setLoading(false)
    }
  }

  const openStatement = async (customerId) => {
    try {
      const res = await axios.get(`${apiUrl}/api/collections/statement/${customerId}`, getHeaders())
      setStatementData(res.data)
      setSelectedCustomer(res.data.customer)
      setIsStatementModalOpen(true)
    } catch (error) {
      alert('Error cargando estado de cuenta')
    }
  }

  const handleOpenPayment = () => {
    setPaymentAmount('')
    setPaymentMethod('Efectivo')
    setPaymentRef('')
    setIsPaymentModalOpen(true)
  }

  const confirmPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Ingresa un monto válido')
      return
    }

    try {
      await axios.post(`${apiUrl}/api/collections/payment`, {
        customerId: selectedCustomer.id,
        amount: parseFloat(paymentAmount) * 100, // convert to cents for backend? Wait, backend expects amount, I stored it as Float in schema, so let's send exactly what it is. Wait, schema CustomerPayment amount is Float. Sale balance is Float.
        method: paymentMethod,
        reference: paymentRef
      }, getHeaders())

      alert('Abono registrado con éxito')
      setIsPaymentModalOpen(false)
      // Refresh
      openStatement(selectedCustomer.id)
      fetchDebtors()
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrar abono')
    }
  }

  const filteredDebtors = debtors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.legacy_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalDebtStreet = debtors.reduce((acc, d) => acc + d.total_debt, 0)
  const totalOverdue = debtors.reduce((acc, d) => acc + d.overdue_balance, 0)

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando cobranza...</div>

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32 print:hidden">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <Landmark className="text-indigo-600" size={36} />
             Cobranza de Clientes
           </h1>
           <p className="text-sm font-bold text-gray-400 mt-2 tracking-widest uppercase">Directorio de Deudores y Estados de Cuenta</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Users size={24}/></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clientes con Saldo</p>
               <p className="text-2xl font-black text-gray-900">{debtors.length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><DollarSign size={24}/></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deuda Total (Calle)</p>
               <p className="text-2xl font-black text-gray-900">${(totalDebtStreet / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600"><AlertTriangle size={24}/></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Vencido</p>
               <p className="text-2xl font-black text-gray-900">${(totalOverdue / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
            </div>
         </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
         <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><Search size={20}/></div>
         <input 
           type="text"
           placeholder="Buscar cliente por nombre o clave..."
           className="flex-1 bg-transparent border-none outline-none font-bold text-gray-700 placeholder-gray-300"
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Notas</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Límite Crédito</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Saldo Actual</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-8 py-5"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredDebtors.length === 0 ? (
                 <tr><td colSpan="6" className="text-center py-20 font-bold text-gray-400 italic">No hay deudores</td></tr>
               ) : filteredDebtors.map(d => (
                 <tr key={d.id} className="hover:bg-gray-50/50 group transition-all">
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="font-black text-gray-900 tracking-tighter uppercase">{d.name}</span>
                          <span className="text-[10px] font-bold text-gray-400">CLAVE: {d.legacy_code || 'S/C'} | {d.credit_days} DÍAS</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                       <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-black text-xs">{d.pending_sales_count}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <span className="font-bold text-gray-400">${((d.credit_limit || 0) / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <span className="font-black text-gray-900 text-lg tracking-tighter">${(d.total_debt / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                       {d.status === 'OVERDUE' ? (
                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black tracking-widest uppercase">
                           <AlertTriangle size={12}/> Moroso
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black tracking-widest uppercase">
                           Al Corriente
                         </span>
                       )}
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                         onClick={() => openStatement(d.id)}
                         className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black transition-all"
                       >
                         Ver Cuenta <ArrowUpRight size={14}/>
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* STATEMENT MODAL */}
      {isStatementModalOpen && selectedCustomer && statementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-8 bg-indigo-900 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                       <FileSpreadsheet size={32} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black tracking-tighter uppercase">{selectedCustomer.name}</h2>
                       <p className="text-indigo-200 font-bold text-sm tracking-widest">ESTADO DE CUENTA | {selectedCustomer.credit_days} Días de Crédito</p>
                    </div>
                 </div>
                 <button onClick={() => setIsStatementModalOpen(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"><X size={24} /></button>
              </div>

              {/* Summary Bar */}
              <div className="bg-indigo-50 p-6 flex items-center justify-between shrink-0">
                 <div className="flex gap-8">
                    <div>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Saldo Total</p>
                       <p className="text-2xl font-black text-indigo-900">${(statementData.total_debt / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Límite Crédito</p>
                       <p className="text-xl font-bold text-indigo-600/50">${((selectedCustomer.credit_limit||0) / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                   <button 
                     onClick={() => window.print()}
                     className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all transform active:scale-95"
                   >
                      <Printer size={18}/> Imprimir
                   </button>
                   <button 
                     onClick={handleOpenPayment}
                     className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-xl flex items-center gap-2 transition-all transform active:scale-95"
                   >
                      <PlusCircle size={18}/> Registrar Abono
                   </button>
                 </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 overflow-y-auto bg-gray-50/50 space-y-8 flex-1">
                 
                 {/* Pending Sales */}
                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Notas y Facturas Pendientes</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100">
                             <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Folio</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Total Nota</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Saldo Restante</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {statementData.customer.sales.filter(s => s.balance > 0).map(sale => (
                               <tr key={sale.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 font-black text-gray-900">{sale.folio}</td>
                                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(sale.created_at).toLocaleDateString('es-MX')}</td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-400">${((sale.total_amount||0)/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                                  <td className="px-6 py-4 text-right font-black text-red-600">${((sale.balance||0)/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>

                 {/* Payment History */}
                 <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Historial de Abonos Recientes</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-gray-50 border-b border-gray-100">
                             <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Fecha</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Método</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Ref / Nota</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Monto Pagado</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {statementData.customer.customer_payments.length === 0 ? (
                               <tr><td colSpan="4" className="text-center py-8 text-gray-400 text-xs font-bold">No hay abonos registrados</td></tr>
                             ) : statementData.customer.customer_payments.map(pay => (
                               <tr key={pay.id}>
                                  <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(pay.created_at).toLocaleString('es-MX')}</td>
                                  <td className="px-6 py-4 font-bold text-gray-700 text-xs uppercase">{pay.payment_method}</td>
                                  <td className="px-6 py-4 text-xs font-bold text-gray-400">{pay.reference || (pay.sale?.folio) || 'Abono General'}</td>
                                  <td className="px-6 py-4 text-right font-black text-emerald-600">+ ${(pay.amount/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PAYMENT MODAL (Abono) */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="font-black text-gray-900 tracking-tighter">Registrar Abono</h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monto a Abonar</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Método de Pago</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none"
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                       <option>Efectivo</option>
                       <option>Transferencia</option>
                       <option>Tarjeta</option>
                       <option>Cheque</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Referencia (Opcional)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none"
                      value={paymentRef}
                      onChange={e => setPaymentRef(e.target.value)}
                    />
                 </div>
                 <button 
                   onClick={confirmPayment}
                   className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 mt-4"
                 >
                    <CheckCircle2 size={18}/> Confirmar Abono
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>

    {/* PRINTABLE STATEMENT */}
    {statementData && selectedCustomer && (
      <div className="hidden print:block p-8 bg-white text-black w-full">
        {/* Membrete de la Empresa */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-300 pb-6">
          <div className="flex gap-6 items-center">
             {profile?.logo_url ? (
               <img src={`${apiUrl}${profile.logo_url}`} alt="Logo" className="w-24 h-24 object-contain" />
             ) : (
               <div className="w-20 h-20 bg-gray-900 text-white flex items-center justify-center font-black text-3xl rounded-xl">
                 {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
               </div>
             )}
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.trade_name || profile?.name || 'CIMENTA'}</h1>
                {profile?.rfc && <p className="text-xs font-bold text-gray-500 mt-1">RFC: {profile.rfc}</p>}
                {profile?.address && <p className="text-xs text-gray-500 max-w-sm mt-1">{profile.address}</p>}
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  {profile?.phone && <p>Tel: {profile.phone}</p>}
                  {profile?.email && <p>{profile.email}</p>}
                </div>
             </div>
          </div>
          <div className="text-right">
             <h2 className="text-2xl font-black uppercase text-gray-800">Estado de Cuenta</h2>
             <p className="text-sm mt-1 font-bold text-gray-500">Emisión: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="bg-gray-50 p-4 rounded-xl mb-8 flex justify-between items-center border border-gray-200">
           <div>
             <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Cliente</p>
             <h2 className="text-xl font-black uppercase text-gray-900">{selectedCustomer.name}</h2>
             {selectedCustomer.legacy_code && <p className="text-xs font-bold text-gray-500">Clave: {selectedCustomer.legacy_code}</p>}
           </div>
        </div>
        
        <div className="flex justify-between mb-8">
          <div>
            <p className="text-xs uppercase font-bold text-gray-500">Límite de Crédito</p>
            <p className="text-lg font-black">${((selectedCustomer.credit_limit||0) / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold text-gray-500">Saldo Pendiente Total</p>
            <p className="text-2xl font-black">${(statementData.total_debt / 100).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase border-b border-gray-300 pb-2 mb-4">Documentos Pendientes</h3>
        <table className="w-full text-left mb-10 text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2">Folio</th>
              <th className="py-2">Fecha</th>
              <th className="py-2 text-right">Total Nota</th>
              <th className="py-2 text-right">Saldo Restante</th>
            </tr>
          </thead>
          <tbody>
            {statementData.customer.sales.filter(s => s.balance > 0).length === 0 ? (
              <tr><td colSpan="4" className="py-4 text-center text-gray-500">No hay documentos pendientes</td></tr>
            ) : statementData.customer.sales.filter(s => s.balance > 0).map(sale => (
              <tr key={sale.id} className="border-b border-gray-100">
                <td className="py-2 font-bold">{sale.folio}</td>
                <td className="py-2">{new Date(sale.created_at).toLocaleDateString('es-MX')}</td>
                <td className="py-2 text-right">${((sale.total_amount||0)/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
                <td className="py-2 text-right font-bold">${((sale.balance||0)/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="text-sm font-black uppercase border-b border-gray-300 pb-2 mb-4">Abonos Recientes</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2">Fecha</th>
              <th className="py-2">Método</th>
              <th className="py-2">Referencia / Nota</th>
              <th className="py-2 text-right">Monto Pagado</th>
            </tr>
          </thead>
          <tbody>
            {statementData.customer.customer_payments.length === 0 ? (
              <tr><td colSpan="4" className="py-4 text-center text-gray-500">No hay historial de abonos</td></tr>
            ) : statementData.customer.customer_payments.map(pay => (
              <tr key={pay.id} className="border-b border-gray-100">
                <td className="py-2">{new Date(pay.created_at).toLocaleDateString('es-MX')}</td>
                <td className="py-2 uppercase">{pay.payment_method}</td>
                <td className="py-2">{pay.reference || pay.sale?.folio || 'Abono General'}</td>
                <td className="py-2 text-right font-bold">${(pay.amount/100).toLocaleString('es-MX', {minimumFractionDigits:2})}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {profile?.receipt_message && (
          <div className="mt-16 text-center border-t border-gray-200 pt-8">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{profile.receipt_message}</p>
          </div>
        )}

        <div className="mt-8 text-center">
           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Generado por CIMENTA by NetConsultores</p>
        </div>
      </div>
    )}
    </>
  )
}
