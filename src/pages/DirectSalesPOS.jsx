import React, { useState, useEffect, useRef } from 'react'
import { Search, ShoppingCart, Plus, Minus, Package, Banknote, CreditCard, Trash2, User, X, ScanLine, ShieldCheck, Truck, Printer, Keyboard } from 'lucide-react'
import axios from 'axios'
import { useCompany } from '../contexts/CompanyContext'
import { PrintableTicket } from '../components/ThermalTicket'
import { sound } from '../utils/audioFeedback'

const ProductCard = ({ product, onAdd, inCartQty }) => (
  <div 
    className="bg-white/70 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl hover:scale-[1.03] hover:bg-white transition-all cursor-pointer group flex flex-col justify-between overflow-hidden relative focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:outline-none" 
    onClick={() => onAdd(product)}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onAdd(product)
      }
    }}
  >
    {inCartQty > 0 && (
      <div className="absolute top-4 left-4 z-20 bg-primary-600 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-primary-200 animate-in zoom-in-95 duration-200">
        {inCartQty} en carrito
      </div>
    )}
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
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
  const receivedAmountRef = useRef(null)
  
  const subtotal = total / 1.16
  const taxes = total - subtotal

  const isCredit = paymentMethod === 'CREDIT_STORE'
  const hasCredit = customer && customer.credit_limit > 0
  const creditOk = !isCredit || hasCredit
  
  const cashOk = paymentMethod !== 'CASH' || (receivedAmount && parseFloat(receivedAmount) >= (total / 100))
  const deliveryOk = !isDelivery || deliveryAddress.trim().length > 5
  const canConfirm = cashOk && deliveryOk && creditOk && !isProcessing

  // Auto focus amount when cash is active or modal opens
  useEffect(() => {
    if (isOpen && activeTab === 'payment') {
      const timer = setTimeout(() => {
        if (paymentMethod === 'CASH') {
          receivedAmountRef.current?.focus()
          receivedAmountRef.current?.select()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, paymentMethod, activeTab])

  // Global key listener inside Checkout Modal (Esc to close, Enter to submit, 1-5 to switch payment)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === 'Enter') {
        // If Enter is pressed outside inputs and canConfirm is true
        if (e.target.tagName !== 'TEXTAREA') {
          if (canConfirm) {
            e.preventDefault()
            onConfirm(paymentMethod, isDelivery, deliveryAddress, parseFloat(receivedAmount) || 0)
          }
        }
      } else if (e.altKey || (!['INPUT', 'TEXTAREA'].includes(e.target.tagName))) {
        if (e.key === '1') setPaymentMethod('CASH')
        else if (e.key === '2') setPaymentMethod('CARD')
        else if (e.key === '3') setPaymentMethod('TRANSFER')
        else if (e.key === '4') setPaymentMethod('CREDIT_STORE')
        else if (e.key === '5') setPaymentMethod('CONTRA_ENTREGA')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, canConfirm, paymentMethod, isDelivery, deliveryAddress, receivedAmount, onConfirm, onClose])

  if (!isOpen) return null


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
  const [view, setView] = useState('products')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [lastSale, setLastSale] = useState(null)
  const [lastCart, setLastCart] = useState([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  const searchInputRef = useRef(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };
  
  // Auto focus search input on mount and view change
  useEffect(() => {
    if (view === 'products' && !isCheckoutOpen && !showSuccessModal) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [view, isCheckoutOpen, showSuccessModal])

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
    const timeoutId = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      return [...prev, { ...product, qty: 1 }]
    })
    sound.playScanBeep()
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
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0)

  const handleProcessSale = () => {
    if (cart.length === 0) return alert('El carrito está vacío')
    setIsCheckoutOpen(true)
  }

  // Handle Enter key on product search (Barcode / SKU search)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const query = search.trim().toLowerCase()
      if (query.length > 0) {
        if (products.length > 0) {
          // Exact match priority (legacy_code / barcode / exact name)
          const exactMatch = products.find(p => 
            p.legacy_code?.toLowerCase() === query || 
            p.barcode?.toLowerCase() === query ||
            p.name?.toLowerCase() === query
          )
          const target = exactMatch || products[0]
          addToCart(target)
          setSearch('')
        } else {
          sound.playWarningTone()
        }
      } else if (cart.length > 0) {
        // Enter on empty search with items in cart -> open checkout
        setIsCheckoutOpen(true)
      }
    } else if (e.key === 'Escape') {
      setSearch('')
    }
  }

  // Global hotkeys listener (F2, F12, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setView('products')
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter') || e.key === 'F9') {
        if (!isCheckoutOpen && !showSuccessModal && cart.length > 0) {
          e.preventDefault()
          setIsCheckoutOpen(true)
        }
      } else if (e.key === 'Escape') {
        if (showSuccessModal) {
          e.preventDefault()
          setShowSuccessModal(false)
          searchInputRef.current?.focus()
        } else if (isCheckoutOpen) {
          e.preventDefault()
          setIsCheckoutOpen(false)
          searchInputRef.current?.focus()
        } else if (view === 'cart') {
          e.preventDefault()
          setView('products')
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [cart, isCheckoutOpen, showSuccessModal, view])

  const confirmSale = async (method, isDelivery, deliveryAddress, receivedAmountVal) => {
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
      sound.playSuccessChime()
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
    <div className="flex flex-col gap-6 lg:gap-8 h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
      {/* Product Search & Cart Button Area */}
      <div className="flex gap-4 items-center shrink-0 px-2 lg:px-0">
        <div className="relative group flex-grow">
          <div className="absolute inset-0 bg-primary-500/5 blur-3xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <Search className="absolute left-7 lg:left-8 top-1/2 -translate-y-1/2 text-primary-500/50 group-focus-within:text-primary-600 transition-colors" size={32} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Escanear o buscar producto (Alta Velocidad)..." 
            className="w-full pl-24 pr-44 py-6 lg:py-8 bg-white/50 backdrop-blur-md border border-white shadow-2xl rounded-[3rem] outline-none focus:ring-4 ring-primary-500/10 text-xl lg:text-3xl font-black transition-all placeholder:text-gray-300 focus-visible:ring-4 focus-visible:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            tabIndex={1}
          />
          <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center space-x-2 text-gray-400">
             <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <kbd className="kbd-badge">Enter ↵</kbd> Agregar
             </span>
             <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100/90 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <kbd className="kbd-badge">F2</kbd> Buscar
             </span>
          </div>
        </div>
        
        {/* Cart Toggle Button */}
        <button 
          onClick={() => setView(view === 'products' ? 'cart' : 'products')}
          className={`relative py-6 px-8 rounded-[3rem] font-black text-xl flex items-center gap-4 transition-all shadow-2xl border focus-visible:ring-4 focus-visible:ring-primary-500 ${
            view === 'cart' 
              ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-500' 
              : 'bg-white text-gray-900 border-white hover:bg-gray-50'
          }`}
          tabIndex={2}
          title="Alternar entre Catálogo y Carrito (Tab)"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            {totalItems > 0 && (
              <span className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md animate-bounce-short">
                {totalItems}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">
            {view === 'cart' ? 'Ver Catálogo' : 'Ver Carrito'}
          </span>
        </button>
      </div>

      {/* Bottom Area: toggle between Catalog and Cart */}
      {view === 'products' ? (
        <div className="flex-grow overflow-y-auto px-2 lg:px-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 lg:gap-6 pb-10">
            {products.map(product => {
              const cartItem = cart.find(item => item.id === product.id);
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAdd={addToCart} 
                  inCartQty={cartItem ? cartItem.qty : 0} 
                />
              );
            })}
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
      ) : (
        <div className="flex-grow overflow-hidden flex flex-col lg:flex-row gap-6 lg:gap-8 h-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl border border-white p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Left Column: Cart Items List */}
          <div className="flex-grow flex flex-col min-h-0 bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-inner p-4 lg:p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="font-black text-gray-900 text-lg lg:text-xl uppercase tracking-wider">Artículos Agregados ({totalItems})</h3>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])} 
                  className="text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-red-500 rounded-lg p-1"
                >
                  Vaciar Carrito
                </button>
              )}
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {cart.map(item => (
                <div key={item.id} className="group p-4 lg:p-5 rounded-[1.8rem] bg-gray-50 border border-gray-100 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-3 items-center flex-grow min-w-0">
                     <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white rounded-xl flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                        <Package size={24} />
                     </div>
                     <div className="min-w-0">
                        <h5 className="font-black text-gray-900 text-sm lg:text-base line-clamp-1 leading-tight tracking-tight uppercase break-words">{item.name}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{item.legacy_code}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                     <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                        <button onClick={() => adjustQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center font-black text-lg hover:bg-gray-50 rounded-lg transition-all active:scale-75 text-gray-400 focus-visible:ring-2 focus-visible:ring-primary-500">-</button>
                        <input 
                           type="number"
                           className="w-12 text-center bg-transparent font-black text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                           value={item.qty}
                           onChange={(e) => updateQty(item.id, e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault()
                               setView('products')
                               searchInputRef.current?.focus()
                             }
                           }}
                        />
                        <button onClick={() => adjustQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center font-black text-lg hover:bg-gray-50 rounded-lg transition-all active:scale-75 text-gray-400 focus-visible:ring-2 focus-visible:ring-primary-500">+</button>
                     </div>
                     <div className="text-right w-28">
                        <p className="text-[9px] font-black text-gray-400 uppercase">Total</p>
                        <p className="font-black text-gray-900 text-lg lg:text-xl tracking-tighter">${((item.price_1 * item.qty) / 100).toFixed(2)}</p>
                     </div>
                     <button onClick={() => removeFromCart(item.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500">
                        <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="relative mb-6 group">
                       <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl"></div>
                       <div className="w-24 h-24 lg:w-28 lg:h-28 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center text-gray-300 relative z-10">
                          <ShoppingCart size={44} className="text-gray-400/60" />
                       </div>
                    </div>
                    <h4 className="font-black text-gray-900 text-lg uppercase tracking-tight mb-2">Tu carrito está vacío</h4>
                    <p className="font-bold text-gray-400 text-xs max-w-[200px] leading-relaxed">
                       Escanea o busca productos en el buscador superior para agregarlos.
                    </p>
                 </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout Summary */}
          <div className="w-full lg:w-[380px] bg-gray-950 text-white rounded-3xl p-6 lg:p-8 flex flex-col justify-between shadow-2xl shrink-0">
             <div className="space-y-6">
                <div className="border-b border-gray-800 pb-4 flex justify-between items-start">
                   <div>
                     <h4 className="text-xs font-black uppercase text-primary-500 tracking-[0.2em]">Resumen de Cobro</h4>
                     <h3 className="text-2xl font-black mt-1">Caja 01</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Venta Directa</p>
                   </div>
                   <span className="kbd-badge bg-gray-800 text-primary-400 border-gray-700">F12</span>
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between text-xs text-gray-400 uppercase font-black tracking-widest">
                      <span>Subtotal</span>
                      <span>${((total / 1.16) / 100).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400 uppercase font-black tracking-widest">
                      <span>IVA (16%)</span>
                      <span>${((total - (total / 1.16)) / 100).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400 uppercase font-black tracking-widest">
                      <span>Artículos</span>
                      <span>{totalItems}</span>
                   </div>
                </div>
             </div>

             <div className="mt-8 space-y-6">
                <div className="flex justify-between items-end border-t border-gray-800 pt-4">
                   <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">Total MXN</span>
                   <span className="text-3xl lg:text-4xl font-black text-white tracking-tighter drop-shadow-lg leading-none">
                      ${(total / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                   </span>
                </div>
                
                <button 
                  disabled={isProcessing || cart.length === 0}
                  onClick={handleProcessSale}
                  className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-xl shadow-[0_20px_50px_rgba(14,165,233,0.3)] transition-all transform active:scale-[0.96] disabled:bg-gray-800 disabled:shadow-none disabled:opacity-30 flex items-center justify-center gap-3 group focus-visible:ring-4 focus-visible:ring-white"
                  tabIndex={3}
                >
                  {isProcessing ? (
                    <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CreditCard className="transition-transform group-hover:scale-110" size={24} />
                      <span>COBRAR TICKET</span>
                      <kbd className="kbd-badge bg-white/20 text-white border-white/30 ml-2">F12</kbd>
                    </>
                  )}
                </button>
             </div>
          </div>

        </div>
      )}

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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              window.print()
            } else if (e.key === 'Escape' || e.key === ' ') {
              e.preventDefault()
              setShowSuccessModal(false)
              searchInputRef.current?.focus()
            }
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">¡Venta Exitosa!</h2>
            <p className="text-gray-500 font-bold mb-8">Folio generado: {lastSale?.folio}</p>
            
            <div className="space-y-3">
               <button 
                 onClick={() => window.print()}
                 className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors focus-visible:ring-4 focus-visible:ring-primary-500"
                 autoFocus
               >
                 <Printer size={24} /> IMPRIMIR TICKET <kbd className="kbd-badge bg-gray-800 text-gray-300 border-gray-700 ml-2">Enter ↵</kbd>
               </button>
               <button 
                 onClick={() => {
                   setShowSuccessModal(false)
                   searchInputRef.current?.focus()
                 }}
                 className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-200 transition-colors focus-visible:ring-4 focus-visible:ring-primary-500"
               >
                 NUEVA VENTA <kbd className="kbd-badge bg-gray-200 text-gray-700 border-gray-300 ml-2">Esc</kbd>
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

