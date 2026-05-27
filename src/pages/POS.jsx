import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, Plus, Minus, Package, CreditCard, Truck, FileText, Lock, ShieldCheck, User, X } from 'lucide-react'
import axios from 'axios'

const ProductCard = ({ product, onAdd, saleType }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between" onClick={() => onAdd(product)}>
    <div>
      <div className="w-full h-32 bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-300">
        <Package size={32} />
      </div>
      <h4 className="font-bold text-gray-900 line-clamp-2">{product.name}</h4>
      <p className="text-gray-500 text-xs mt-1">{product.legacy_code}</p>
    </div>
    <div className="mt-4 flex justify-between items-center">
      <div className="flex flex-col">
         <span className="text-primary-600 font-black text-lg">${(product.price_1 / 100).toFixed(2)}</span>
         {saleType === 'remission' && (
           <span className="text-xs text-orange-500 font-bold">P2: ${(product.price_2 / 100).toFixed(2)}</span>
         )}
      </div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${saleType === 'anticipo' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white'}`}>
        {saleType === 'anticipo' ? <Lock size={16}/> : <Plus size={18} />}
      </div>
    </div>
  </div>
)

const POS = () => {
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [saleType, setSaleType] = useState('pos') // 'pos', 'remission', 'anticipo'
  
  // Customer selection states
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const query = search.trim() ? `/search?query=${search}` : ''
        const res = await axios.get(`${apiUrl}/api/products${query}`)
        setProducts(res.data)
      } catch(e) { console.error(e) }
    }
    
    const timeoutId = setTimeout(() => {
      fetchProducts()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [search])

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!customerSearch.trim()) {
        setCustomers([])
        return
      }
      try {
        const res = await axios.get(`${apiUrl}/api/customers/search?query=${customerSearch}`, getHeaders())
        setCustomers(res.data)
      } catch(e) { console.error(e) }
    }
    const timeoutId = setTimeout(fetchCustomers, 500)
    return () => clearTimeout(timeoutId)
  }, [customerSearch])

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id)
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...product, qty: 1, selectedPrice: 'price_1' }]
    })
  }

  const changeItemPrice = (id, newPriceKey) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, selectedPrice: newPriceKey } : item))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id))
  
  const total = cart.reduce((acc, item) => acc + (item[item.selectedPrice] * item.qty), 0)

  const handleProcessSale = async () => {
    if (cart.length === 0) return alert('El carrito está vacío')
    if (!selectedCustomer && (saleType === 'remission' || saleType === 'anticipo')) {
      return alert('Debes seleccionar un cliente para este tipo de venta')
    }

    setIsProcessing(true)
    try {
      const payload = {
        customer_id: selectedCustomer?.id || 'public-customer-id', 
        type: saleType.toUpperCase(),
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          price: item[item.selectedPrice],
          discount: 0,
          unit: item.sale_unit || 'PZ'
        })),
        branch_id: 'default-branch-id' 
      }

      await axios.post(`${apiUrl}/api/sales`, payload, getHeaders())
      alert('Venta procesada con éxito')
      setCart([])
      setSelectedCustomer(null)
      setCustomerSearch('')
    } catch (error) {
      console.error(error)
      if (error.response?.status === 403 || error.response?.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        window.location.href = '/login';
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
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-[calc(100vh-180px)]">
      
      {/* Product Area */}
      <div className="xl:col-span-3 flex flex-col space-y-6">
        
        {/* Sale Type Selector & Customer Selector */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-fit">
            <button 
              onClick={() => { setSaleType('pos'); setCart([]); }}
              className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${saleType === 'pos' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ShoppingCart size={18} />
              <span>Venta Directa</span>
            </button>
            <button 
              onClick={() => { setSaleType('remission'); setCart([]); }}
              className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${saleType === 'remission' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={18} />
              <span>Remisión</span>
            </button>
            <button 
              onClick={() => { setSaleType('anticipo'); setCart([]); }}
              className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${saleType === 'anticipo' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ShieldCheck size={18} />
              <span>Anticipo</span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder={selectedCustomer ? selectedCustomer.name : "Buscar Cliente..."}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none font-bold ${selectedCustomer ? 'border-primary-500 text-primary-600' : 'border-gray-100'}`}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setShowCustomerDropdown(true)
                }}
                onFocus={() => setShowCustomerDropdown(true)}
              />
              {selectedCustomer && (
                <button 
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {showCustomerDropdown && customers.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto py-2">
                {customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c)
                      setCustomerSearch('')
                      setShowCustomerDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-primary-50 font-bold text-gray-700 text-sm transition-colors"
                  >
                    {c.name} <span className="text-[10px] text-gray-400">({c.legacy_code})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Busca el producto de tu base de datos..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex-grow overflow-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length === 0 ? (
               <div className="col-span-full pt-10 text-center text-gray-400">No exite el producto o no hay nada en BD PostgreSQL.</div>
            ) : products.map(product => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} saleType={saleType} />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className={`xl:col-span-1 bg-white rounded-3xl shadow-sm border flex flex-col overflow-hidden ${saleType === 'remission' ? 'border-orange-200' : saleType === 'anticipo' ? 'border-purple-200' : 'border-gray-100'}`}>
        <div className={`p-6 border-b flex justify-between ${saleType === 'remission' ? 'bg-orange-50/50 border-orange-100' : saleType === 'anticipo' ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50/50 border-gray-100'}`}>
          <h3 className="font-bold text-gray-900 flex items-center">
            {saleType === 'pos' && <ShoppingCart size={20} className="mr-2 text-primary-600" />}
            {saleType === 'remission' && <FileText size={20} className="mr-2 text-orange-600" />}
            {saleType === 'anticipo' && <Lock size={20} className="mr-2 text-purple-600" />}
            {saleType === 'pos' ? 'Ticket de Caja' : saleType === 'remission' ? 'Nueva Remisión' : 'Pago Anticipado (Congelado)'}
          </h3>
        </div>
        <div className="flex-grow overflow-auto p-4 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center p-8 text-gray-400">Agrega productos</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-start justify-between">
                   <div className="w-2/3">
                      <h5 className="font-bold text-gray-900 text-sm line-clamp-2">{item.name}</h5>
                      <p className={`text-xs font-black mt-1 ${saleType === 'remission' ? 'text-orange-600' : saleType === 'anticipo' ? 'text-purple-600' : 'text-primary-600'}`}>
                        ${(item[item.selectedPrice] / 100).toFixed(2)}
                      </p>
                   </div>
                   <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 p-1">
                     <button onClick={() => addToCart(item)}><Plus size={14}/></button>
                     <span className="font-bold w-4 text-center">{item.qty}</span>
                     <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Minus size={14}/></button>
                   </div>
                </div>
                {/* Remission Price Selector P1-P6 */}
                {saleType === 'remission' && (
                  <select 
                     className="w-full text-xs font-bold bg-white border border-gray-200 rounded-lg p-1.5 outline-none focus:border-orange-400"
                     value={item.selectedPrice}
                     onChange={(e) => changeItemPrice(item.id, e.target.value)}
                  >
                    <option value="price_1">P1 (Público) - ${(item.price_1 / 100).toFixed(2)}</option>
                    <option value="price_2">P2 (Pref) - ${(item.price_2 / 100).toFixed(2)}</option>
                    <option value="price_3">P3 (Mayor) - ${(item.price_3 / 100).toFixed(2)}</option>
                    <option value="price_4">P4 (Contr) - ${(item.price_4 / 100).toFixed(2)}</option>
                    <option value="price_5">P5 (Esp A) - ${(item.price_5 / 100).toFixed(2)}</option>
                    <option value="price_6">P6 (Esp B) - ${(item.price_6 / 100).toFixed(2)}</option>
                  </select>
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-gray-50/80 border-t border-gray-100 space-y-4">
          <div className="flex justify-between text-xl">
            <span className="text-gray-900 font-black">Total MXN</span>
            <span className={`font-black ${saleType === 'remission' ? 'text-orange-600' : saleType === 'anticipo' ? 'text-purple-600' : 'text-primary-600'}`}>
               ${(total / 100).toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button className="flex items-center justify-center p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-900 transition-all font-black text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-900 shadow-sm">
                <Truck size={18} className="mr-2" />
                Domi.
             </button>
             <button 
               disabled={isProcessing}
               onClick={handleProcessSale}
               className={`flex items-center justify-center p-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all transform active:scale-95 ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : (saleType === 'remission' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : saleType === 'anticipo' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-100')}`}
             >
                {isProcessing ? 'Pausado...' : (saleType === 'remission' ? 'Crear Remisión' : saleType === 'anticipo' ? 'Congelar' : 'Cobrar')}
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default POS
