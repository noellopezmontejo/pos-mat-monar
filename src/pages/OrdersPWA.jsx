import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Package, CreditCard, 
  User, X, ChevronRight, ArrowLeft, CheckCircle2, 
  Trash2, Banknote, CreditCard as CardIcon, Receipt, 
  Calculator, ScanLine, Tag, Store, Info, FileText
} from 'lucide-react';
import axios from 'axios';

const OrdersPWA = () => {
  const [activeView, setActiveView] = useState('catalog'); // 'catalog', 'cart', 'checkout', 'success'
  const [orderType, setOrderType] = useState('remission'); // 'remission', 'anticipo'
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Checkout states
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Debounced product search
  useEffect(() => {
    const fetchProducts = async () => {
      if (!search.trim() && activeView === 'catalog') {
        setProducts([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axios.get(`${apiUrl}/api/products/search?query=${search}`, getHeaders());
        setProducts(res.data);
      } catch (e) { console.error(e); }
      finally { setIsSearching(false); }
    };

    const timeoutId = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timeoutId);
  }, [search, activeView]);

  // Debounced customer search
  useEffect(() => {
    if (activeView !== 'checkout') return;
    const fetchCustomers = async () => {
      if (!customerSearch.trim()) {
        setCustomers([]);
        return;
      }
      try {
        const res = await axios.get(`${apiUrl}/api/customers/search?query=${customerSearch}`, getHeaders());
        setCustomers(res.data);
      } catch (e) { console.error(e); }
    };
    const timeoutId = setTimeout(fetchCustomers, 400);
    return () => clearTimeout(timeoutId);
  }, [customerSearch, activeView]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + ((item.price_1 || 0) * item.qty), 0);

  const handleProcessOrder = async () => {
    if (cart.length === 0) return alert('Carrito vacío');
    if (!selectedCustomer) return alert('Selecciona un cliente');
    
    setIsProcessing(true);
    try {
      const orderData = {
        customer_id: selectedCustomer.id,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty,
          unit_price: item.price_1
        })),
        payment_method: paymentMethod,
        sale_type: orderType === 'remission' ? 'REMISION_PWA' : 'ANTICIPO_PWA'
      };
      
      await axios.post(`${apiUrl}/api/sales`, orderData, getHeaders());
      setCart([]);
      setActiveView('success');
    } catch (e) {
      alert(e.response?.data?.error || 'Error al procesar orden');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCatalog = () => (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center space-x-3">
         <button 
           onClick={() => setOrderType('remission')}
           className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${orderType === 'remission' ? 'bg-primary-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
         >Remisión</button>
         <button 
           onClick={() => setOrderType('anticipo')}
           className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${orderType === 'anticipo' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
         >Anticipo</button>
      </div>
      
      <div className="p-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            className="w-full pl-14 pr-12 py-5 bg-gray-50 rounded-[2rem] outline-none border-2 border-transparent focus:border-primary-500/30 focus:bg-white transition-all text-xl font-bold text-gray-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {products.map(product => (
          <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between">
            <div className="flex items-center space-x-5">
               <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                 <Package size={30} />
               </div>
               <div>
                  <h3 className="font-extrabold text-gray-900 text-lg line-clamp-1">{product.name}</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase">{product.legacy_code}</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-primary-600">${((product.price_1 || 0) / 100).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">+ Agregar</p>
            </div>
          </div>
        ))}
        {products.length === 0 && !isSearching && (
          <div className="text-center py-20 opacity-30">
             <FileText size={64} className="mx-auto mb-4" />
             <p className="font-black text-xl italic uppercase tracking-widest">Esperando búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right-full duration-500">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => setActiveView('catalog')} className="p-3 bg-gray-50 rounded-2xl"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-gray-900">Carrito {orderType === 'remission' ? 'Remisión' : 'Anticipo'}</h2>
        <button onClick={() => setCart([])} className="p-3 bg-red-50 text-red-500 rounded-2xl"><Trash2 size={24} /></button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {cart.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><Package size={28} /></div>
              <div>
                <h4 className="font-extrabold text-gray-900 line-clamp-1">{item.name}</h4>
                <p className="text-lg font-black text-primary-600 mt-0.5">${((item.price_1 || 0) / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
              <div className="flex items-center bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 h-14">
                <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-black text-lg border border-gray-100">-</button>
                <input 
                   type="number"
                   min="1"
                   value={item.qty}
                   onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setCart(prev => prev.map(p => p.id === item.id ? { ...p, qty: Math.max(1, val) } : p));
                   }}
                   className="w-14 text-center bg-transparent border-none outline-none font-black text-lg p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-black text-lg border border-gray-100">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-white border-t border-gray-100 rounded-t-[3rem] shadow-2xl space-y-6">
        <div className="flex justify-between items-end">
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-2">Total {orderType === 'remission' ? 'Remisión' : 'Anticipo'}</p>
          <p className="text-5xl font-black text-gray-900 tracking-tight">${((cartTotal || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
        </div>
        <button onClick={() => setActiveView('checkout')} className={`w-full py-6 text-white rounded-[2rem] font-extrabold text-xl shadow-xl flex items-center justify-center space-x-3 ${orderType === 'remission' ? 'bg-primary-600 shadow-primary-200' : 'bg-orange-600 shadow-orange-200'}`}>
          <span>Continuar al Pago</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );

  const renderCheckout = () => (
    <div className="flex flex-col h-full bg-gray-50 animate-in slide-in-from-right-full duration-500">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <button onClick={() => setActiveView('cart')} className="p-3 bg-gray-50 rounded-2xl"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-gray-900">Finalizar {orderType === 'remission' ? 'Remisión' : 'Anticipo'}</h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Cliente (Requerido)</h3>
          {!selectedCustomer ? (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="w-full px-6 py-5 bg-white rounded-[2rem] border-2 border-transparent focus:border-primary-500 outline-none font-bold text-lg shadow-sm"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {customers.map(c => (
                  <button key={c.id} onClick={() => setSelectedCustomer(c)} className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-700 active:bg-primary-50 active:border-primary-200 transition-colors">{c.full_name || c.name}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className={`p-6 rounded-[2.5rem] border flex items-center space-x-4 ${orderType === 'remission' ? 'bg-primary-50 border-primary-100' : 'bg-orange-50 border-orange-100'}`}>
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white ${orderType === 'remission' ? 'bg-primary-600' : 'bg-orange-600'}`}><User size={32} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Cliente Seleccionado</p>
                <h4 className="text-xl font-black line-clamp-1">{selectedCustomer.full_name || selectedCustomer.name}</h4>
                <button onClick={() => setSelectedCustomer(null)} className="text-[10px] font-black text-red-500 uppercase mt-1">Cambiar</button>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Método de Pago</h3>
          <div className="grid grid-cols-2 gap-4">
            {['Efectivo', 'Tarjeta', 'Transferencia', 'Crédito'].map(m => (
              <button 
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center justify-center space-y-3 relative ${paymentMethod === m ? 'border-primary-500 bg-white shadow-xl scale-[1.02]' : 'border-gray-100 bg-white grayscale opacity-60'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${paymentMethod === m ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-400'}`}><Calculator size={28} /></div>
                <span className="font-extrabold text-gray-900">{m}</span>
                {paymentMethod === m && <div className="absolute top-4 right-4"><CheckCircle2 size={20} className="text-primary-500" /></div>}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="p-8 bg-white border-t border-gray-100 rounded-t-[3rem] shadow-2xl">
         <button 
          disabled={isProcessing}
          onClick={handleProcessOrder}
          className={`w-full py-6 text-white rounded-[2rem] font-extrabold text-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-50 ${orderType === 'remission' ? 'bg-primary-600 shadow-primary-200' : 'bg-orange-600 shadow-orange-200'}`}
        >
          {isProcessing ? <Calculator className="animate-spin" size={32}/> : <span>GENERAR {orderType.toUpperCase()}</span>}
        </button>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col h-full bg-white items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
      <div className="w-40 h-40 bg-green-50 rounded-[3rem] flex items-center justify-center mb-8 relative">
         <div className="absolute inset-0 bg-green-500 rounded-[3rem] animate-ping opacity-20"></div>
         <CheckCircle2 size={80} className="text-green-500 relative z-10" />
      </div>
      <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">¡Documento Generado!</h2>
      <p className="text-gray-500 font-bold max-w-xs mx-auto text-lg">La {orderType} ha sido creada correctamente.</p>
      
      <div className="mt-12 w-full space-y-4">
         <button onClick={() => { setActiveView('catalog'); setSearch(''); setSelectedCustomer(null); }} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-xl active:scale-95 transition-transform">Nuevo Documento</button>
         <button className="w-full py-5 bg-gray-100 text-gray-600 rounded-[2rem] font-black text-xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"><Receipt size={24} /> <span>Ver Ticket</span></button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col font-sans select-none overflow-hidden max-w-md mx-auto shadow-2xl ring-1 ring-gray-200">
      {activeView === 'catalog' && (
        <header className="px-8 py-10 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1">PWA ORDERS TERMINAL</h1>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Especiales</h2>
          </div>
          <button onClick={() => setActiveView('cart')} className="relative p-4 bg-primary-50 text-primary-600 rounded-[1.5rem] active:scale-90 transition-transform shadow-sm">
            <ShoppingCart size={32} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-4 border-white animate-bounce-short">{cart.length}</span>}
          </button>
        </header>
      )}

      <main className="flex-grow relative overflow-hidden">
        {activeView === 'catalog' && renderCatalog()}
        {activeView === 'cart' && renderCart()}
        {activeView === 'checkout' && renderCheckout()}
        {activeView === 'success' && renderSuccess()}
      </main>
    </div>
  );
};

export default OrdersPWA;
