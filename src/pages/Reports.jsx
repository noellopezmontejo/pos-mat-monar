import React, { useState, useEffect } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { 
  BarChart3, Calendar, Search, Download, Printer, 
  Package, Truck, ShoppingCart, Banknote, Users, 
  FileText, ArrowRightLeft, CreditCard, Wallet, 
  ChevronLeft, ChevronRight, AlertCircle, Filter,
  Box, ShoppingBag, Landmark, FileDown
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'

const Reports = () => {
  const { profile } = useCompany()
  const [activeTab, setActiveTab] = useState('products')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({})
  
  // Filters
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002'

  const tabs = [
    { id: 'products', label: 'Productos', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'inventory', label: 'Inventario', icon: Box, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'kardex', label: 'Kardex', icon: ArrowRightLeft, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'purchases', label: 'Compras / OC', icon: ShoppingBag, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'supplier-payments', label: 'Pagos Prov.', icon: Wallet, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'accounts-payable', label: 'CxP (Deudas)', icon: CreditCard, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'pos-sales', label: 'Punto de Venta', icon: ShoppingCart, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { id: 'sales', label: 'Ventas / Remis.', icon: FileText, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'cash-sessions', label: 'Cortes Caja', icon: Banknote, color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { id: 'customer-collections', label: 'Abonos Clientes', icon: Landmark, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    { id: 'accounts-receivable', label: 'CxC (Cartera)', icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-50' },
  ]

  const getHeaders = () => {
    const token = localStorage.getItem('token')
    if (!token) return {}
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${apiUrl}/api/reports/${activeTab}`, {
        params: { from, to, search: searchTerm },
        ...getHeaders()
      })
      setData(res.data.data || [])
      setSummary(res.data.summary || {})
    } catch (error) {
      console.error('Error fetching report:', error)
      const msg = error.response?.data?.error || error.response?.data?.details || error.message || 'Error al conectar con el servidor'
      const status = error.response?.status ? `[${error.response.status}] ` : ''
      setError(`${status}${msg}`)
      setData([])
      setSummary({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, from, to])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchData()
  }

  const exportToExcel = () => {
    if (!data || data.length === 0) return
    const columns = getColumnsForTab(activeTab)
    
    const excelData = data.map(row => {
      const obj = {}
      columns.forEach(col => {
        const val = col.render ? col.render(row) : row[col.key]
        obj[col.label] = val
      })
      return obj
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte")
    XLSX.writeFile(wb, `Reporte_${activeTab}_${from}_to_${to}.xlsx`)
  }

  const renderSummary = () => {
    if (!summary || Object.keys(summary).length === 0) return null
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm print:p-4 print:border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {typeof value === 'number' && (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('valuation') || key.toLowerCase().includes('debt') || key.toLowerCase().includes('receivable') || key.toLowerCase().includes('recovered') || key.toLowerCase().includes('difference'))
                ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                : value}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const currentTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
  const columns = getColumnsForTab(activeTab)

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 print:bg-white print:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 ${currentTabInfo.bgColor} ${currentTabInfo.color} rounded-2xl flex items-center justify-center shadow-sm`}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Reportes Empresariales</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentTabInfo.label}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
             <div className="flex bg-slate-100 p-1 rounded-xl">
              <div className="flex items-center px-3 space-x-2 border-r border-slate-200">
                <Calendar size={14} className="text-slate-400" />
                <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-28" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="flex items-center px-3 space-x-2">
                <input type="date" className="bg-transparent border-none text-xs font-bold text-slate-600 outline-none w-28" value={to} onChange={e => setTo(e.target.value)} />
              </div>
            </div>
            <button 
              onClick={exportToExcel} 
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <FileDown size={18} />
              <span>Excel</span>
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-lg"
            >
              <Printer size={18} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Print Header (Visible only when printing) */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {profile.logo_url && (
              <img src={`${apiUrl}${profile.logo_url}`} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase">{profile.name}</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Reporte de {currentTabInfo.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Periodo</p>
            <p className="text-lg font-black text-slate-900">{from} — {to}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Generado: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-80 shrink-0 space-y-2 print:hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                activeTab === tab.id 
                ? `${tab.bgColor} ${tab.color} shadow-sm ring-1 ring-inset ring-black/5` 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-4">
                <tab.icon size={20} className={activeTab === tab.id ? tab.color : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="font-black text-sm tracking-tight">{tab.label}</span>
              </div>
              {activeTab === tab.id && <div className={`w-1.5 h-1.5 rounded-full ${tab.color.replace('text', 'bg')}`} />}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-grow space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start space-x-4 text-red-700 print:hidden">
              <AlertCircle size={24} className="shrink-0" />
              <div>
                 <p className="font-black text-lg tracking-tight">Error al cargar reporte</p>
                 <p className="text-sm font-bold opacity-80">{error}</p>
                 <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-100">Reintentar</button>
              </div>
            </div>
          )}

          {!loading && renderSummary()}

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between print:hidden">
                <div className="relative flex-grow max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <form onSubmit={handleSearch}>
                      <input 
                        type="text" 
                        placeholder="Buscar en este reporte..." 
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                   </form>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      {columns.map(col => (
                        <th key={col.key} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-900 print:py-2">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={columns.length} className="p-20 text-center animate-pulse text-slate-400 font-black tracking-widest uppercase">Cargando datos...</td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={columns.length} className="p-20 text-center text-slate-300 font-bold italic">No se encontraron registros en este periodo.</td></tr>
                    ) : (
                      data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          {columns.map(col => (
                            <td key={col.key} className="px-6 py-4 text-sm font-bold text-slate-600 print:text-slate-900 print:py-2">
                              {col.render ? col.render(row) : row[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 1cm; size: landscape; }
          body { background: white !important; }
          .min-h-screen { background: white !important; padding: 0 !important; }
          header, aside, .print-hidden { display: none !important; }
          main { width: 100% !important; margin: 0 !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th, td { padding: 8px !important; border: 1px solid #e2e8f0 !important; font-size: 10px !important; }
          .bg-white { background: white !important; }
          .shadow-sm, .shadow-lg { box-shadow: none !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; }
        }
      `}} />
    </div>
  )
}

const getColumnsForTab = (tab) => {
  const formatCents = (val) => `$${((val || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  const formatDollars = (val) => `$${(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  const formatDate = (val) => val ? new Date(val).toLocaleDateString('es-MX') : 'N/A'

  switch (tab) {
    case 'products':
      return [
        { key: 'legacy_code', label: 'Clave' },
        { key: 'name', label: 'Nombre' },
        { key: 'category', label: 'Categoría', render: r => r.category?.name || 'S/C' },
        { key: 'supplier', label: 'Proveedor', render: r => r.supplier?.name || 'S/P' },
        { key: 'cost', label: 'Costo', render: r => formatCents(r.cost) },
        { key: 'price_1', label: 'P1', render: r => formatCents(r.price_1) },
        { key: 'status', label: 'Estatus' }
      ]
    case 'inventory':
      return [
        { key: 'product_code', label: 'Clave', render: r => r.product?.legacy_code },
        { key: 'product_name', label: 'Producto', render: r => r.product?.name },
        { key: 'branch', label: 'Sucursal', render: r => r.branch?.name },
        { key: 'quantity', label: 'Existencia' },
        { key: 'valuation', label: 'Valor Est.', render: r => formatCents(r.quantity * (r.product?.cost || 0)) }
      ]
    case 'kardex':
      return [
        { key: 'created_at', label: 'Fecha', render: r => new Date(r.created_at).toLocaleString() },
        { key: 'product', label: 'Producto', render: r => r.product?.name },
        { key: 'type', label: 'Tipo' },
        { key: 'reason', label: 'Motivo' },
        { key: 'quantity', label: 'Cant.' },
        { key: 'balance', label: 'Saldo' },
        { key: 'user', label: 'Usuario', render: r => r.user?.name }
      ]
    case 'purchases':
      return [
        { key: 'folio', label: 'Folio' },
        { key: 'supplier', label: 'Proveedor', render: r => r.supplier?.name },
        { key: 'created_at', label: 'Fecha', render: r => formatDate(r.created_at) },
        { key: 'status', label: 'Estatus' },
        { key: 'total_amount', label: 'Total', render: r => formatDollars(r.total_amount) }
      ]
    case 'supplier-payments':
      return [
        { key: 'created_at', label: 'Fecha', render: r => formatDate(r.created_at) },
        { key: 'supplier', label: 'Proveedor', render: r => r.payment?.supplier?.name },
        { key: 'amount', label: 'Monto', render: r => formatDollars(r.amount) },
        { key: 'payment_method', label: 'Método' },
        { key: 'reference', label: 'Referencia' }
      ]
    case 'accounts-payable':
      return [
        { key: 'supplier', label: 'Proveedor', render: r => r.supplier?.name },
        { key: 'reception_id', label: 'ID Ref' },
        { key: 'due_date', label: 'Vencimiento', render: r => formatDate(r.due_date) },
        { key: 'amount', label: 'Total', render: r => formatDollars(r.amount) },
        { key: 'balance', label: 'Saldo Pend.', render: r => formatDollars(r.balance) },
        { key: 'status', label: 'Status' }
      ]
    case 'pos-sales':
      return [
        { key: 'folio', label: 'Folio' },
        { key: 'customer', label: 'Cliente', render: r => r.customer?.name || 'Público' },
        { key: 'created_at', label: 'Fecha', render: r => formatDate(r.created_at) },
        { key: 'payment_method', label: 'Método' },
        { key: 'total_amount', label: 'Total', render: r => formatDollars(r.total_amount) }
      ]
    case 'sales':
      return [
        { key: 'folio', label: 'Folio' },
        { key: 'customer', label: 'Cliente', render: r => r.customer?.name },
        { key: 'type', label: 'Tipo' },
        { key: 'created_at', label: 'Fecha', render: r => formatDate(r.created_at) },
        { key: 'status', label: 'Status' },
        { key: 'total_amount', label: 'Total', render: r => formatDollars(r.total_amount) },
        { key: 'balance', label: 'Saldo', render: r => formatDollars(r.balance) }
      ]
    case 'cash-sessions':
      return [
        { key: 'user', label: 'Cajero', render: r => r.user?.name },
        { key: 'opened_at', label: 'Apertura', render: r => new Date(r.opened_at).toLocaleString() },
        { key: 'closed_at', label: 'Cierre', render: r => r.closed_at ? new Date(r.closed_at).toLocaleString() : 'ABIERTA' },
        { key: 'opening_balance', label: 'Fondo', render: r => formatCents(r.opening_balance) },
        { key: 'closing_balance', label: 'Real', render: r => formatCents(r.closing_balance) },
        { key: 'expected_balance', label: 'Esperado', render: r => formatCents(r.expected_balance) },
        { key: 'diff', label: 'Diff.', render: r => r.status === 'CLOSED' ? formatCents(r.closing_balance - r.expected_balance) : '-' }
      ]
    case 'customer-collections':
      return [
        { key: 'created_at', label: 'Fecha', render: r => new Date(r.created_at).toLocaleString() },
        { key: 'customer', label: 'Cliente', render: r => r.customer?.name },
        { key: 'sale', label: 'Folio Venta', render: r => r.sale?.folio || 'Abono Gral' },
        { key: 'amount', label: 'Monto', render: r => formatDollars(r.amount) },
        { key: 'payment_method', label: 'Método' },
        { key: 'reference', label: 'Ref.' }
      ]
    case 'accounts-receivable':
      return [
        { key: 'customer', label: 'Cliente', render: r => r.customer?.name },
        { key: 'folio', label: 'Folio Venta' },
        { key: 'created_at', label: 'Fecha Venta', render: r => formatDate(r.created_at) },
        { key: 'total_amount', label: 'Total Venta', render: r => formatDollars(r.total_amount) },
        { key: 'balance', label: 'Saldo Pend.', render: r => formatDollars(r.balance) },
        { key: 'status', label: 'Status' }
      ]
    default:
      return []
  }
}

export default Reports
