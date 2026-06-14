import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, Plus, Minus, Package, Banknote, CreditCard, Trash2, User, X, ScanLine, ShieldCheck, Truck, Printer } from 'lucide-react'
import axios from 'axios'
import { useCompany } from '../contexts/CompanyContext'
import { PrintableTicket } from '../components/ThermalTicket'

const ProductCard = ({ product, onAdd }) => (
  <div 
    className="bg-white/70 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl hover:scale-[1.03] hover:bg-white transition-all cursor-pointer group flex flex-col justify-between overflow-hidden relative" 
    onClick={() => onAdd(product)}
  >
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
       <div className="bg-primary-600 text-white p-2 rounded-full shadow-lg shadow-primary-200">
          <Plus size={20} />
       </div>
    </div>
    <div>
      <div className="w-full h-40 bg-gray-50/50 rounded-3xl mb-5 flex items-center justify-center text-gray-200 group-hover:bg-primary-50 group-hover:text-primary-200 transition-colors">
        <Package size={56} />
      </div>
      <h4 className="font-black text-gray-900 line-clamp-2 text-base leading-tight pr-2 uppercase tracking-tight">{product.name}</h4>
      <p className="text-gray-400 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">{product.legacy_code}</p>
    </div>
    <div className="mt-6 flex justify-between items-end">
      <div className="flex flex-col">
         <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">Precio Unitario</span>
         <span className="text-3xl font-black text-gray-900 tracking-tighter">${(product.price_1 / 100).toFixed(2)}</span>
      </div>
    </div>
  </div>
)

const CheckoutModal = ({ isOpen, onClose, cart, total, onConfirm, isProcessing, customer }) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [receivedAmount, setReceivedAmount] = useState('')
  const [isDelivery, setIsDelivery] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [activeTab, setActiveTab] = useState('payment') // 'payment' or 'delivery'
  
  if (!isOpen) return null

  const subtotal = total / 1.16
  const taxes = total - subtotal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto animate-in zoom-in-95 duration-500">
        
        {/* Left Side: Summary & Items */}
        <div className="flex-grow p-10 md:p-14 overflow-auto custom-scrollbar border-r border-gray-100 bg-gray-50/30">
          <div className="flex items-center justify-between mb-10">
             <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">Confirmar Venta</h2>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mt-2">{customer?.name || 'Venta al Público'}</p>
             </div>
             <button onClick={onClose} className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm"><X size={24} /></button>
          </div>

          <div className="space-y-4 mb-10">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                <div className="pr-4">
                  <p className="font-black text-gray-900 uppercase text-sm tracking-tight line-clamp-1">{item.name}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                    {item.qty} x ${(item.price_1/100).toFixed(2)}
                  </p>
                </div>
                <span className="font-black text-gray-900 text-lg tracking-tighter shrink-0">${((item.price_1 * item.qty)/100).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                <span>IVA (16%)</span>
                <span>${(taxes / 100).toFixed(2)}</span>
             </div>
             <div className="pt-4 border-t border-gray-50 flex justify-between items-end">
                <span className="text-lg font-black text-primary-600 uppercase tracking-widest leading-none">Total Neto</span>
                <span className="text-5xl font-black text-gray-900 tracking-tighter leading-none">${(total / 100).toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* Right Side: Configuration (Tabs) */}
        <div className="w-full md:w-[500px] p-10 md:p-14 bg-white flex flex-col">
          
          <div className="flex space-x-2 bg-gray-50 p-2 rounded-2xl mb-10 border border-gray-100">
             <button 
                onClick={() => setActiveTab('payment')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'payment' ? 'bg-white text-primary-600 shadow-sm border border-primary-100' : 'text-gray-400'}`}
             >
                Forma de Pago
             </button>
             <button 
                onClick={() => setActiveTab('delivery')}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'delivery' ? 'bg-white text-primary-600 shadow-sm border border-primary-100' : 'text-gray-400'}`}
             >
                Envío Domicilio
             </button>
          </div>

          <div className="flex-grow">
            {activeTab === 'payment' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'CASH', label: 'Efectivo', icon: Banknote },
                    { id: 'CARD', label: 'Tarjeta', icon: CreditCard },
                    { id: 'TRANSFER', label: 'Transferencia', icon: ScanLine },
                    { id: 'CREDIT_STORE', label: 'Crédito', icon: ShieldCheck },
                    { id: 'CONTRA_ENTREGA', label: 'Contra Entrega', icon: Truck }
                  ].map(m => (
                    <button 
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all group ${paymentMethod === m.id ? 'bg-gray-950 border-gray-950 text-white shadow-xl shadow-gray-200' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-white'}`}
                    >
                      <m.icon size={32} className={`mb-3 transition-transform group-hover:scale-110 ${paymentMethod === m.id ? 'text-primary-500' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === 'CASH' && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <label className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 block ml-2">Monto Recibido (Requerido)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">$</span>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className={`w-full py-6 pl-12 pr-6 bg-gray-50 border-2 rounded-[1.5rem] outline-none text-3xl font-black transition-all shadow-inner ${
                          receivedAmount && parseFloat(receivedAmount) >= (total / 100)
                            ? 'border-green-400 bg-green-50'
                            : receivedAmount ? 'border-red-300 bg-red-50' : 'border-transparent focus:border-primary-500/20'
                        }`}
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                      />
                    </div>
                    {receivedAmount && parseFloat(receivedAmount) < (total / 100) && (
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center gap-3">
                        <span className="text-red-500 font-black text-xs uppercase tracking-widest">⚠ Monto insuficiente — faltan ${((total / 100) - parseFloat(receivedAmount)).toFixed(2)}</span>
                      </div>
                    )}
                    {receivedAmount && parseFloat(receivedAmount) >= (total / 100) && (
                      <div className="p-6 bg-green-50 rounded-2xl border border-green-200 flex justify-between items-center transition-all animate-in zoom-in-95">
                        <span className="text-xs font-black text-green-700 uppercase tracking-widest">✓ Cambio a devolver</span>
                        <span className="text-2xl font-black text-green-800 tracking-tighter">
                          ${(parseFloat(receivedAmount) - (total/100)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <button 
                  onClick={() => setIsDelivery(!isDelivery)}
                  className={`w-full p-8 rounded-3xl border-2 flex items-center justify-between transition-all ${isDelivery ? 'bg-primary-50 border-primary-200 shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                >
                   <div className="flex items-center space-x-6">
                      <div className={`p-4 rounded-2xl ${isDelivery ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                         <Truck size={32} />
                      </div>
                      <div className="text-left">
                         <p className={`font-black uppercase tracking-widest ${isDelivery ? 'text-primary-900' : 'text-gray-400'}`}>Solicitar Envío</p>
                         <p className="text-[10px] font-bold uppercase tracking-tight mt-1">Vincular con Logística</p>
                      </div>
                   </div>
                   <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDelivery ? 'border-primary-600 bg-primary-600 text-white shadow-xl' : 'border-gray-200 bg-white'}`}>
                      {isDelivery && <ShieldCheck size={16} />}
                   </div>
                </button>

                {isDelivery && (
                   <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <label className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 block ml-2">Dirección de Entrega</label>
                      <textarea 
                        className="w-full p-6 bg-gray-50 border-2 border-transparent focus:border-primary-500/20 rounded-[1.5rem] outline-none text-lg font-bold transition-all shadow-inner h-32 resize-none"
                        placeholder="Calle, Número, Colonia, CP..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      ></textarea>
                      <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-2 italic">Se notificará al chofer asignado automáticamente.</p>
                   </div>
                )}
              </div>
            )}
          </div>

          {/*  Cash / Credit guard */}
          {(() => {
            const isCredit = paymentMethod === 'CREDIT_STORE'
            const hasCredit = customer && customer.credit_limit > 0
            const creditOk = !isCredit || hasCredit
            
            const cashOk = paymentMethod !== 'CASH' || (receivedAmount && parseFloat(receivedAmount) >= (total / 100))
            const deliveryOk = !isDelivery || deliveryAddress.trim().length > 5
            
            const canConfirm = cashOk && deliveryOk && creditOk && !isProcessing
            
            let hint = ''
            if (!cashOk) hint = 'Ingresa el monto recibido (≥ total)'
            else if (!deliveryOk) hint = 'Ingresa la dirección de entrega'
            else if (!creditOk) hint = 'El cliente no tiene línea de crédito autorizada'
            
            return (
              <div className="mt-10">
                {hint && <p className="text-center text-xs font-black text-red-500 uppercase tracking-widest mb-3">{hint}</p>}
                <button 
                  disabled={!canConfirm}
                  onClick={() => onConfirm(paymentMethod, isDelivery, deliveryAddress, parseFloat(receivedAmount) || 0)}
                  className={`w-full py-8 rounded-[2.5rem] font-black text-3xl shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${
                    canConfirm
                      ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <div className="w-10 h-10 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Finalizar Venta</span>
                  )}
                </button>
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}

const DirectSalesPOS = () => {
  const { profile } = useCompany()
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [lastSale, setLastSale] = useState(null)
  const [lastCart, setLastCart] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const query = search.trim() ? `/search?query=${search}` : ''
        const res = await axios.get(`${apiUrl}/api/products${query}`)
        setProducts(res.data)
      } catch(e) { 
        console.error(e)
      }
    }
    const timeoutId = setTimeout(fetchProducts, 400)
    return () => clearTimeout(timeoutId)
  }, [search])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      return [...prev, { ...product, qty: 1 }]
    })
    if (window.navigator.vibrate) window.navigator.vibrate(40);
  }

  const updateQty = (id, val) => {
    const quantity = parseInt(val) || 1
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, quantity) } : item))
  }

  const adjustQty = (id, delta) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))
  const total = cart.reduce((acc, item) => acc + (item.price_1 * item.qty), 0)

  const handleProcessSale = () => {
    if (cart.length === 0) return alert('El carrito está vacío')
    setIsCheckoutOpen(true)
  }

  const confirmSale = async (method, isDelivery, deliveryAddress) => {
    const headers = getHeaders();
    if (!headers.headers?.Authorization) {
      alert('Sesión no válida.')
      window.location.hash = '#/login'
      window.location.reload()
      return
    }

    setIsProcessing(true)
    try {
      const payload = {
        type: 'POS',
        payment_method: method,
        is_delivery: isDelivery,
        delivery_address: deliveryAddress,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          price: item.price_1,
          unit: item.sale_unit || 'PZ'
        }))
      }
      const res = await axios.post(`${apiUrl}/api/sales`, payload, headers)
      const newSale = res.data
      setLastCart([...cart])
      setLastSale(newSale)
      setCart([])
      setIsCheckoutOpen(false)
      setShowSuccessModal(true)
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        window.location.hash = '#/login';
        window.location.reload();
        return;
      }
      const serverError = error.response?.data?.error || error.message;
      const details = error.response?.data?.details ? `\n\nDetalle técnico: ${error.response.data.details}` : '';
      alert('Error: ' + serverError + details)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
      {/* Product Search Area - takes 9/12 on XL, 8/12 on LG, full on Mobile */}
      <div className="flex-grow lg:w-[65%] xl:w-[75%] flex flex-col space-y-6 lg:space-y-8 overflow-hidden h-full">
        <div className="relative group shrink-0 px-2 lg:px-0">
          <div className="absolute inset-0 bg-primary-500/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <Search className="absolute left-7 lg:left-8 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-primary-600 transition-colors" size={32} />
          <input 
            type="text" 
            placeholder="Escanear o buscar producto (Alta Velocidad)..." 
            className="w-full pl-24 pr-10 py-6 lg:py-8 bg-white/50 backdrop-blur-md border border-white shadow-2xl rounded-[3rem] outline-none focus:ring-4 ring-primary-500/10 text-xl lg:text-3xl font-black transition-all placeholder:text-gray-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center space-x-2 text-gray-300">
             <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100/80 px-4 py-2 rounded-full flex items-center gap-2">
                <ScanLine size={14} /> Scanner Activo
             </span>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto px-2 lg:px-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 lg:gap-6 pb-10">
            {products.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} />
            ))}
          </div>
          {products.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20 lg:py-32">
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-primary-500 blur-3xl opacity-10 animate-pulse"></div>
                   <Package size={120} className="relative z-10 opacity-10" />
                </div>
                <p className="font-black uppercase tracking-[0.4em] text-lg lg:text-xl opacity-20">Inventario Digital</p>
             </div>
          )}
        </div>
      </div>

      {/* Cart Area - takes 3/12 on XL, 4/12 on LG, full on Mobile */}
      <div className="lg:w-[35%] xl:w-[25%] bg-white/40 backdrop-blur-2xl rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl border border-white flex flex-col overflow-hidden h-[500px] lg:h-full shrink-0">
        <div className="p-6 lg:p-10 bg-white/60 border-b border-gray-100 flex items-center justify-between shrink-0">
             <div className="flex items-center">
               <div className="w-10 h-10 lg:w-14 lg:h-14 bg-primary-600 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200 mr-4 lg:mr-5">
                 <ShoppingCart size={24} className="lg:hidden" />
                 <ShoppingCart size={28} className="hidden lg:block" />
               </div>
               <div>
                  <h3 className="font-black text-gray-900 text-lg lg:text-2xl tracking-tighter leading-none">Caja 01</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 lg:mt-1.5">Venta Directa</p>
               </div>
             </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 custom-scrollbar bg-white">
          {cart.map(item => (
            <div key={item.id} className="group p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-gray-50 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col space-y-3 lg:space-y-4">
              <div className="flex justify-between items-start">
                 <div className="w-full">
                    <h5 className="font-black text-gray-900 text-sm lg:text-base line-clamp-2 leading-tight tracking-tight uppercase">{item.name}</h5>
                    <div className="flex items-center mt-2 space-x-2">
                       <span className="text-[9px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-md uppercase">P1 Base</span>
                       <span className="text-gray-400 font-bold text-xs lg:text-sm">${(item.price_1 / 100).toFixed(2)}</span>
                    </div>
                 </div>
                 <button onClick={() => removeFromCart(item.id)} className="p-2 lg:p-3 bg-red-50 text-red-500 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 shrink-0 ml-2">
                    <Trash2 size={16} lg:size={18} />
                 </button>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                 <div className="flex items-center bg-gray-50 rounded-[1.25rem] lg:rounded-[1.5rem] border border-gray-100 p-1 lg:p-1.5">
                    <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center font-black text-xl lg:text-2xl hover:bg-white hover:shadow-sm rounded-lg lg:rounded-xl transition-all active:scale-75 text-gray-400">-</button>
                    <input 
                       type="number"
                       className="w-10 lg:w-14 text-center bg-transparent font-black text-lg lg:text-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900"
                       value={item.qty}
                       onChange={(e) => updateQty(item.id, e.target.value)}
                    />
                    <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center font-black text-xl lg:text-2xl hover:bg-white hover:shadow-sm rounded-lg lg:rounded-xl transition-all active:scale-75 text-gray-400">+</button>
                 </div>
                 <p className="font-black text-gray-900 text-lg lg:text-xl tracking-tighter">${((item.price_1 * item.qty) / 100).toFixed(2)}</p>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-gray-200 py-10 lg:py-20">
                <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                   <Banknote size={48} className="lg:hidden opacity-10" />
                   <Banknote size={60} className="hidden lg:block opacity-10" />
                </div>
                <p className="font-black text-[10px] uppercase tracking-[0.3em] text-center max-w-[150px] leading-relaxed">Inicia escaneando productos</p>
             </div>
          )}
        </div>

        <div className="p-6 lg:p-10 bg-gray-950 text-white rounded-t-[3rem] lg:rounded-t-[4rem] shadow-2xl shrink-0 space-y-6 lg:space-y-8">
          <div className="space-y-2 lg:space-y-4">
             <div className="flex justify-between items-end pt-2">
                <div className="flex flex-col">
                   <span className="text-[10px] lg:text-sm font-black text-primary-500 uppercase tracking-[0.3em]">Total MXN</span>
                </div>
                <span className="text-3xl lg:text-5xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                   ${(total / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
             </div>
          </div>
          
          <button 
            disabled={isProcessing || cart.length === 0}
            onClick={handleProcessSale}
            className="w-full py-5 lg:py-8 bg-primary-600 hover:bg-primary-500 text-white rounded-[1.5rem] lg:rounded-[2.5rem] font-black text-xl lg:text-3xl shadow-[0_20px_50px_rgba(14,165,233,0.3)] transition-all transform active:scale-[0.96] disabled:bg-gray-800 disabled:shadow-none disabled:opacity-30 flex items-center justify-center group"
          >
            {isProcessing ? (
              <div className="w-8 h-8 lg:w-10 lg:h-10 border-4 lg:border-8 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CreditCard className="mr-4 lg:mr-6 transition-transform group-hover:scale-110" size={24} lg:size={32} />
                <span>COBRAR Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CheckoutModal 
         isOpen={isCheckoutOpen} 
         onClose={() => setIsCheckoutOpen(false)} 
         cart={cart} 
         total={total} 
         onConfirm={confirmSale}
         isProcessing={isProcessing}
         customer={selectedCustomer}
      />

      {/* MODAL DE VENTA EXITOSA */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">¡Venta Exitosa!</h2>
            <p className="text-gray-500 font-bold mb-8">Folio generado: {lastSale?.folio}</p>
            
            <div className="space-y-3">
               <button 
                 onClick={() => window.print()}
                 className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
               >
                 <Printer size={24} /> IMPRIMIR TICKET
               </button>
               <button 
                 onClick={() => setShowSuccessModal(false)}
                 className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-200 transition-colors"
               >
                 NUEVA VENTA
               </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENEDOR DE IMPRESIÓN (OCULTO EN PANTALLA) */}
      {lastSale && (
         <PrintableTicket sale={lastSale} items={lastCart} company={profile} type="DIRECT" />
      )}
    </div>
  )
}

export default DirectSalesPOS
