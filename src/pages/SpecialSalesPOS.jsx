import React, { useState, useEffect, useRef } from 'react'
import { Search, FileText, Lock, Plus, Package, User, X, Trash2, ShieldCheck, ChevronDown, Truck, Printer } from 'lucide-react'
import axios from 'axios'
import { useCompany } from '../contexts/CompanyContext'
import { PrintableTicket } from '../components/ThermalTicket'

const CheckoutModal = ({ isOpen, onClose, cart, total, onConfirm, isProcessing, saleType, customer }) => {
  const [paymentMethod, setPaymentMethod] = useState('PAGO_EN_CAJA')
  const [isDelivery, setIsDelivery] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [activeTab, setActiveTab] = useState('payment')
  const [deliveryOption, setDeliveryOption] = useState('cliente')
  
  if (!isOpen) return null
  const subtotal = total / 1.16
  const taxes = total - subtotal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300 print:hidden">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[90vh]">
        <div className="flex-grow p-10 md:p-14 overflow-auto custom-scrollbar border-r border-gray-100 bg-gray-50/30">
          <div className="flex items-center justify-between mb-10">
             <div><h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Confirmar {saleType}</h2><p className="text-[10px] font-black text-primary-600 uppercase mt-2">{customer?.name || 'Venta al Público'}</p></div>
             <button onClick={onClose} className="p-4 bg-white border rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"><X size={24} /></button>
          </div>
          <div className="space-y-4 mb-10">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-3xl border shadow-sm">
                <div className="pr-4"><p className="font-black text-gray-900 uppercase text-sm line-clamp-1">{item.name}</p><p className="text-[10px] font-black text-gray-400 mt-1 uppercase"> {item.qty} x ${(item[item.selectedPriceKey]/100).toFixed(2)} </p></div>
                <span className="font-black text-gray-900 text-lg tracking-tighter shrink-0">${((item[item.selectedPriceKey] * item.qty)/100).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3 bg-white p-8 rounded-[2.5rem] border shadow-sm">
             <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px]"><span>Subtotal</span><span>${(subtotal / 100).toFixed(2)}</span></div>
             <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px]"><span>IVA (16%)</span><span>${(taxes / 100).toFixed(2)}</span></div>
             <div className="pt-4 border-t flex justify-between items-end"><span className="text-lg font-black text-primary-600 uppercase leading-none">Total Neto</span><span className="text-5xl font-black text-gray-900 tracking-tighter leading-none">${(total / 100).toFixed(2)}</span></div>
          </div>
        </div>
        <div className="w-full md:w-[500px] p-10 md:p-14 bg-white flex flex-col">
          <div className="flex space-x-2 bg-gray-50 p-2 rounded-2xl mb-10 border">
             <button onClick={() => setActiveTab('payment')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === 'payment' ? 'bg-white text-primary-600 shadow-sm border' : 'text-gray-400'}`}>Pago</button>
             <button onClick={() => setActiveTab('delivery')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest ${activeTab === 'delivery' ? 'bg-white text-primary-600 shadow-sm border' : 'text-gray-400'}`}>Envío</button>
          </div>
          <div className="flex-grow overflow-auto">
            {activeTab === 'payment' ? (
              <div className="grid grid-cols-2 gap-4">
                {[ { id: 'PAGO_EN_CAJA', label: 'Caja', icon: Lock }, { id: 'CONTRA_ENTREGA', label: 'Contra Entrega', icon: Truck }, { id: 'CREDIT_STORE', label: 'Crédito', icon: ShieldCheck } ].map(m => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all group ${paymentMethod === m.id ? 'bg-gray-950 border-gray-950 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <m.icon size={32} className={`mb-3 ${paymentMethod === m.id ? 'text-primary-500' : ''}`} /><span className="text-[10px] font-black uppercase">{m.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button onClick={() => setIsDelivery(!isDelivery)} className={`w-full p-6 rounded-3xl border-2 flex items-center justify-between ${isDelivery ? 'bg-primary-50 border-primary-200 shadow-lg' : 'bg-gray-50 text-gray-400'}`}><div className="flex items-center space-x-4"><div className={`p-3 rounded-2xl ${isDelivery ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}><Truck size={24} /></div><p className="font-black uppercase text-xs">Solicitar Envío</p></div></button>
                {isDelivery && (
                   <div className="space-y-4">
                      <div className="flex gap-4"><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={deliveryOption === 'cliente'} onChange={() => setDeliveryOption('cliente')} /> <span className="text-[10px] font-black uppercase">Cliente</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={deliveryOption === 'otra'} onChange={() => setDeliveryOption('otra')} /> <span className="text-[10px] font-black uppercase">Otra</span></label></div>
                      <textarea className="w-full p-6 bg-gray-50 rounded-[1.5rem] outline-none text-sm font-bold shadow-inner h-32 resize-none" placeholder="Dirección..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}></textarea>
                   </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-10"><button disabled={isProcessing || !cart.length} onClick={() => onConfirm(paymentMethod, isDelivery, deliveryAddress || (customer?.address || ''))} className={`w-full py-8 rounded-[2.5rem] font-black text-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center ${isProcessing || !cart.length ? 'bg-gray-200 text-gray-400' : 'bg-primary-600 text-white'}`}>{isProcessing ? <div className="w-10 h-10 border-8 border-white border-t-transparent rounded-full animate-spin"></div> : <span>Finalizar</span>}</button></div>
        </div>
      </div>
    </div>
  )
}

const SpecialSalesPOS = () => {
  const { profile } = useCompany()
  const [cart, setCart] = useState([]); const [search, setSearch] = useState(''); const [products, setProducts] = useState([])
  const [showProductDropdown, setShowProductDropdown] = useState(false); const productDropdownRef = useRef(null)
  const [saleType, setSaleType] = useState('remission'); const [customerSearch, setCustomerSearch] = useState(''); const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState({ id: null, name: 'MOSTRADOR' }); const [showCustomerDropdown, setShowCustomerDropdown] = useState(false); const customerDropdownRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false); const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [lastSale, setLastSale] = useState(null); const [lastCart, setLastCart] = useState([]); const [showSuccessModal, setShowSuccessModal] = useState(false); const [printType, setPrintType] = useState('REMISION_SHORT')
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const h = (e) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) setShowProductDropdown(false);
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) setShowCustomerDropdown(false);
    };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  
  useEffect(() => {
    const f = async () => { try { const q = search.trim() ? `/search?query=${search}` : ''; const r = await axios.get(`${apiUrl}/api/products${q}`); setProducts(r.data); } catch(e) {} };
    const t = setTimeout(f, 400); return () => clearTimeout(t);
  }, [search])

  useEffect(() => {
    const f = async () => { if (!customerSearch.trim()) { setCustomers([]); return; } try { const r = await axios.get(`${apiUrl}/api/customers/search?query=${customerSearch}`); setCustomers(r.data); } catch(e) {} };
    const t = setTimeout(f, 400); return () => clearTimeout(t);
  }, [customerSearch])

  const addToCart = (p) => setCart(prev => { const e = prev.find(i => i.id === p.id); if (e) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i); return [...prev, { ...p, qty: 1, selectedPriceKey: 'price_1' }] })
  const updateQty = (id, val) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, parseInt(val) || 1) } : i))
  const adjustQty = (id, d) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i))
  const changeItemPrice = (id, k) => setCart(prev => prev.map(i => i.id === id ? { ...i, selectedPriceKey: k } : i))
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const total = cart.reduce((acc, i) => acc + ((i[i.selectedPriceKey] || 0) * i.qty), 0)

  const handlePrint = () => { if (window.electronAPI && window.electronAPI.send) { window.electronAPI.send('print-direct'); } else { window.print(); } }

  const confirmSale = async (method, isDelivery, deliveryAddress) => {
    const token = localStorage.getItem('token'); if (!token) return; setIsProcessing(true)
    try {
      const p = { customer_id: selectedCustomer.id, type: saleType.toUpperCase(), payment_method: method, is_delivery: isDelivery, delivery_address: deliveryAddress, items: cart.map(i => ({ product_id: i.id, quantity: i.qty, price: i[i.selectedPriceKey], unit: i.sale_unit || 'PZ' })) }
      const res = await axios.post(`${apiUrl}/api/sales`, p, { headers: { Authorization: `Bearer ${token}` } })
      const s = res.data; setLastCart([...cart]); setLastSale({ ...s, total_amount: s.total_amount || total }); setCart([]); setSelectedCustomer({ id: null, name: 'MOSTRADOR' }); setIsCheckoutOpen(false); setShowSuccessModal(true)
    } catch (e) { alert('Error: ' + (e.response?.data?.error || e.message)) } finally { setIsProcessing(false) }
  }

  return (
    <>
      {lastSale && (
         <PrintableTicket sale={lastSale} items={lastCart.map(i => ({ quantity: i.qty, price: i[i.selectedPriceKey], product: { name: i.name, legacy_code: i.legacy_code } }))} company={profile} type={printType} />
      )}
      <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex flex-col space-y-6 overflow-hidden pt-4 px-4 lg:px-0 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-6 rounded-[2rem] shadow-lg border shrink-0 relative z-50">
          <div className="flex space-x-2 bg-gray-50 p-2 rounded-[1.5rem] border shrink-0"><button onClick={() => setSaleType('remission')} className={`px-8 py-3 rounded-[1.25rem] font-black text-xs uppercase tracking-widest flex items-center space-x-3 transition-all ${saleType === 'remission' ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' : 'text-gray-400'}`}> <FileText size={18} /> <span>Remisión</span> </button><button onClick={() => setSaleType('anticipo')} className={`px-8 py-3 rounded-[1.25rem] font-black text-xs uppercase tracking-widest flex items-center space-x-3 transition-all ${saleType === 'anticipo' ? 'bg-purple-700 text-white shadow-lg shadow-purple-100' : 'text-gray-400'}`}> <Lock size={18} /> <span>Anticipo</span> </button></div>
          <div className="relative flex-grow" ref={customerDropdownRef}><div className="relative group"><User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} /><input type="text" placeholder={selectedCustomer?.id ? selectedCustomer.name : "Vincular Cliente..."} className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 rounded-[1.5rem] outline-none font-black text-base" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }} /></div>{showCustomerDropdown && (customerSearch || customers.length > 0) && (<div className="absolute z-50 w-full mt-3 bg-white border rounded-3xl shadow-2xl max-h-72 overflow-y-auto py-3"><button onClick={() => { setSelectedCustomer({ id: null, name: 'MOSTRADOR' }); setCustomerSearch(''); setShowCustomerDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-gray-100 font-black uppercase text-xs">MOSTRADOR</button>{customers.map(c => (<button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerDropdown(false); }} className="w-full text-left px-6 py-4 hover:bg-primary-50 flex flex-col"><span className="font-black text-gray-800 uppercase">{c.name}</span><span className="text-[10px] text-gray-400 font-bold uppercase">{c.legacy_code}</span></button>))}</div>)}</div>
        </div>
        <div className="relative shrink-0 z-40" ref={productDropdownRef}><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={28} /><input type="text" placeholder="Buscar artículo..." className="w-full pl-20 pr-10 py-5 bg-white border shadow-xl rounded-[2rem] outline-none text-2xl font-black" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} />{showProductDropdown && search && (<div className="absolute top-[calc(100%+12px)] left-0 w-full bg-white border rounded-[2rem] shadow-2xl max-h-72 overflow-y-auto p-3">{products.map(p => (<button key={p.id} onClick={() => { addToCart(p); setSearch(''); setShowProductDropdown(false); }} className="w-full text-left p-4 hover:bg-gray-50 rounded-2xl flex items-center justify-between group"><div><p className="font-black text-gray-900 uppercase">{p.name}</p><p className="text-[10px] text-gray-400 font-bold">CÓD: {p.legacy_code}</p></div><p className="font-black text-lg text-gray-900 ml-4">${(p.price_1/100).toFixed(2)}</p></button>))}</div>)}</div>
        <div className="flex-grow bg-white rounded-[2.5rem] shadow-xl border overflow-hidden flex flex-col"><div className="flex-grow overflow-y-auto p-8 space-y-4">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-gray-300"><Package size={80} className="opacity-20 mb-4" /><p className="font-black text-xs uppercase">Selecciona artículos</p></div>) : (cart.map(i => (<div key={i.id} className="p-6 rounded-[2rem] bg-gray-50 border flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-grow"><h5 className="font-black text-gray-900 uppercase text-sm">{i.name}</h5><p className="text-[10px] text-gray-400 font-bold">CÓD: {i.legacy_code}</p></div><div className="flex items-center gap-4">{saleType === 'remission' && (<select className="bg-white border rounded-xl px-4 py-3 text-[10px] font-black outline-none" value={i.selectedPriceKey} onChange={(e) => changeItemPrice(i.id, e.target.value)}>{[1,2,3,4,5,6].map(n => <option key={n} value={`price_${n}`}>P{n} — ${(i[`price_${n}`]/100).toFixed(2)}</option>)}</select>)}<div className="flex items-center bg-white rounded-xl border p-1"><button onClick={() => adjustQty(i.id, -1)} className="w-10 h-10 font-black text-xl">-</button><input type="number" className="w-14 text-center font-black text-lg outline-none" value={i.qty} onChange={(e) => updateQty(i.id, e.target.value)} /><button onClick={() => adjustQty(i.id, 1)} className="w-10 h-10 font-black text-xl">+</button></div><p className="font-black text-xl text-gray-900 w-24 text-right">${((i[i.selectedPriceKey] * i.qty) / 100).toFixed(2)}</p><button onClick={() => removeFromCart(i.id)} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18} /></button></div></div>)))}</div><div className="p-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50/50"><div><span className="text-[10px] font-black uppercase text-gray-500 block">Total</span><span className="text-5xl font-black text-gray-900 tracking-tighter">${(total / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div><button disabled={isProcessing || !cart.length} onClick={() => setIsCheckoutOpen(true)} className="px-10 py-6 bg-primary-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-primary-700 disabled:opacity-50 flex items-center gap-3"><ShieldCheck size={28} /> <span>PROCESAR VENTA</span></button></div></div>
        <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} cart={cart} total={total} onConfirm={confirmSale} isProcessing={isProcessing} saleType={saleType === 'remission' ? 'Remisión' : 'Anticipo'} customer={selectedCustomer} />
        {showSuccessModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl"><div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldCheck size={48} /></div><h2 className="text-3xl font-black mb-2">¡Venta Exitosa!</h2><p className="text-gray-500 font-bold mb-8">Folio: {lastSale?.folio}</p><div className="space-y-3"><button onClick={() => { setPrintType('REMISION_SHORT'); setTimeout(handlePrint, 500); }} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3"><Printer size={24} /> IMPRIMIR PASE A CAJA</button><button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-lg mt-2">NUEVA VENTA</button></div></div></div>
        )}
      </div>
    </>
  )
}

export default SpecialSalesPOS
