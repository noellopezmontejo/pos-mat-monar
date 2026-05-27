import React, { useState, useEffect } from 'react'
import { 
  ShoppingBag, Truck, CheckSquare, Plus, Search, Filter, 
  Factory, ArrowRight, X, Trash2, Calendar, MapPin, 
  User, Mail, Phone, Map, Tag, RefreshCw, Edit, DollarSign
} from 'lucide-react'
import axios from 'axios'

const Purchases = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'suppliers', 'receiving'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'order', 'supplier', 'receive', 'view_order', 'view_reception'

  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [receptions, setReceptions] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [ordersSearch, setOrdersSearch] = useState('')
  const [receivingSearch, setReceivingSearch] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Form states for NEW ORDER
  const [orderItems, setOrderItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearchStr, setProductSearchStr] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [orderCost, setOrderCost] = useState(0);

  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderSupplierSearchStr, setOrderSupplierSearchStr] = useState('');
  const [orderSupplierResults, setOrderSupplierResults] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Form states for NEW SUPPLIER
  const [supplierForm, setSupplierForm] = useState({
    name: '', rfc: '', phone: '', email: '', address: '', legacy_code: '', credit_days: 0
  });

  // Form states for NEW RECEPTION
  const [selectedOrderForReception, setSelectedOrderForReception] = useState(null);
  const [receptionItems, setReceptionItems] = useState([]); // { product_id, quantity_to_receive }
  const [receptionObservations, setReceptionObservations] = useState('');
  const [branches, setBranches] = useState([]);
  const [almacenistas, setAlmacenistas] = useState([]);
  const [receptionWarehouseId, setReceptionWarehouseId] = useState('');
  const [receptionReceivedBy, setReceptionReceivedBy] = useState('');
  const [orderWarehouseId, setOrderWarehouseId] = useState('');
  const [orderObservations, setOrderObservations] = useState('');


  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  }

  const fetchOrders = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/purchases/orders`, getHeaders())
      setOrders(res.data)
    } catch (e) { 
      console.error(e) 
      const status = e.response?.status ? ` (Error ${e.response.status})` : ""
      alert("Error al obtener órdenes de compra" + status)
    }
  }

  const fetchReceptions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/purchases/receptions`, getHeaders())
      setReceptions(res.data)
    } catch (e) { 
      console.error(e) 
      const status = e.response?.status ? ` (Error ${e.response.status})` : ""
      alert("Error al obtener recepciones" + status)
    }
  }

  const fetchSuppliers = async (query = '') => {
    setLoadingSuppliers(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const url = query 
        ? `${apiUrl}/api/suppliers/search?query=${query}`
        : `${apiUrl}/api/suppliers`
      const res = await axios.get(url, getHeaders())
      setSuppliers(res.data)
    } catch (e) { console.error(e) } finally { setLoadingSuppliers(false) }
  }

  const fetchProducts = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/products`, getHeaders())
      setProducts(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchBranches = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/branches`, getHeaders())
      setBranches(res.data)
    } catch (e) { console.error("Error fetching branches", e) }
  }

  const fetchAlmacenistas = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/users/almacenistas`, getHeaders())
      setAlmacenistas(res.data)
    } catch (e) { console.error("Error fetching almacenistas", e) }
  }

  useEffect(() => {
    fetchOrders()
    fetchReceptions()
    fetchBranches()
    fetchAlmacenistas()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuppliers(supplierSearch)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [supplierSearch])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!ordersSearch) { fetchOrders(); return; }
      setIsSearching(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const res = await axios.get(`${apiUrl}/api/purchases/orders/search?query=${ordersSearch}`, getHeaders())
        if (Array.isArray(res.data)) setOrders(res.data)
        else setOrders([])
      } catch (e) { 
        console.error(e)
        setOrders([])
      } finally { setIsSearching(false); }
    }, 600)
    return () => clearTimeout(timeoutId)
  }, [ordersSearch])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!receivingSearch) { fetchReceptions(); return; }
      setIsSearching(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        const res = await axios.get(`${apiUrl}/api/purchases/receptions/search?query=${receivingSearch}`, getHeaders())
        if (Array.isArray(res.data)) setReceptions(res.data)
        else setReceptions([])
      } catch (e) { 
        console.error(e)
        setReceptions([])
      } finally { setIsSearching(false); }
    }, 600)
    return () => clearTimeout(timeoutId)
  }, [receivingSearch])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!productSearchStr || productSearchStr.length < 2) {
        setProductSearchResults([]);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await axios.get(`${apiUrl}/api/products/search?query=${encodeURIComponent(productSearchStr)}`, getHeaders());
        if (Array.isArray(res.data)) setProductSearchResults(res.data);
      } catch (e) {
        console.error("Error buscando productos", e);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [productSearchStr]);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!orderSupplierSearchStr || orderSupplierSearchStr.length < 2) {
        setOrderSupplierResults([]);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await axios.get(`${apiUrl}/api/suppliers/search?query=${encodeURIComponent(orderSupplierSearchStr)}`, getHeaders());
        if (Array.isArray(res.data)) setOrderSupplierResults(res.data);
      } catch (e) {
        console.error("Error buscando proveedores", e);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [orderSupplierSearchStr]);

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    if (type === 'order') {
      setOrderItems([]);
      setOrderSupplierId('');
      setOrderSupplierSearchStr('');
      setOrderWarehouseId('');
      setOrderObservations('');
      setSelectedOrder(null);
    }
    if (type === 'supplier') setSupplierForm({ name: '', rfc: '', phone: '', email: '', address: '', legacy_code: '' });
    if (type === 'receive') setSelectedOrderForReception(null);
  }

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/suppliers`, supplierForm, getHeaders());
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (e) { alert("Error al crear proveedor"); }
  }

  const handleConfirmReception = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOrderForReception) return;
    
    // Filter only items where quantity > 0 to avoid empty rows
    const itemsToSubmit = receptionItems.filter(i => i.quantity > 0);
    if (itemsToSubmit.length === 0) return alert("Ingresa al menos una cantidad a recibir");
    if (!receptionWarehouseId) return alert("Selecciona el almacén de entrada");
    if (!receptionReceivedBy) return alert("Selecciona quién está recibiendo");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/purchases/receptions`, { 
        purchase_order_id: selectedOrderForReception.id,
        observations: receptionObservations,
        items: itemsToSubmit,
        warehouse_id: receptionWarehouseId,
        received_by: receptionReceivedBy
      }, getHeaders());
      
      setIsModalOpen(false);
      setReceptionItems([]);
      setReceptionObservations('');
      setReceptionWarehouseId('');
      setReceptionReceivedBy('');
      setSelectedOrderForReception(null);
      fetchReceptions();
      fetchOrders();
    } catch (e) { 
      console.error(e);
      alert("Error al confirmar recepción: " + (e.response?.data?.error || e.message)); 
    }
  }

  const handleCancelOrder = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta orden de compra? (Solo si no hay recepciones)')) return
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.delete(`${apiUrl}/api/purchases/orders/${id}`, getHeaders())
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al cancelar orden')
    }
  }

  const handleCancelReception = async (id) => {
    if (!window.confirm('¿Deseas CANCELAR esta recepción? Esto revertirá el stock en inventario y anulará la cuenta por pagar vinculada.')) return
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.delete(`${apiUrl}/api/purchases/receptions/${id}`, getHeaders())
      fetchReceptions()
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al cancelar recepción')
    }
  }

  const addItemToOrder = () => {
    if (!selectedProductId || !selectedProduct) return alert("Selecciona un producto primero")
    if (orderQty <= 0) return alert("Cantidad inválida")
    if (orderCost < 0) return alert("Costo inválido")
    
    setOrderItems([...orderItems, {
      product: selectedProduct,
      product_id: selectedProduct.id,
      quantity: parseInt(orderQty),
      cost: parseFloat(orderCost)
    }])
    setSelectedProductId('')
    setProductSearchStr('')
    setOrderQty(1)
    setOrderCost(0)
  }

  const removeItemFromOrder = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    setOrderSupplierId(order.supplier_id)
    setOrderWarehouseId(order.warehouse_id || '')
    setOrderObservations(order.observations || '')
    setOrderItems(order.items.map(item => ({
      product: item.product,
      product_id: item.product_id,
      quantity: item.quantity,
      cost: item.cost
    })))
    setModalType('order_edit')
    setIsModalOpen(true)
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!orderSupplierId) return alert("Selecciona un proveedor")
    if (orderItems.length === 0) return alert("Agrega al menos un artículo a la orden")
    
    const subtotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0)
    const taxes = subtotal * 0.16 // Assuming 16% IVA
    const total_amount = subtotal + taxes

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const data = {
        supplier_id: orderSupplierId,
        warehouse_id: orderWarehouseId,
        items: orderItems,
        observations: orderObservations,
        subtotal,
        taxes,
        total_amount
      }

      if (modalType === 'order_edit' && selectedOrder) {
        await axios.put(`${apiUrl}/api/purchases/orders/${selectedOrder.id}`, data, getHeaders())
      } else {
        await axios.post(`${apiUrl}/api/purchases/orders`, data, getHeaders())
      }

      setIsModalOpen(false);
      setOrderItems([]);
      setOrderSupplierId('');
      fetchOrders();
    } catch (e) { 
      console.error(e)
      alert(e.response?.data?.error || "Error al procesar la orden de compra"); 
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-fit">
        <button onClick={() => setActiveTab('orders')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'orders' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}><ShoppingBag size={18} /><span>Órdenes de Compra</span></button>
        <button onClick={() => setActiveTab('receiving')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'receiving' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}><CheckSquare size={18} /><span>Recepciones</span></button>
        <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all ${activeTab === 'suppliers' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}><Factory size={18} /><span>Proveedores</span></button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-grow max-w-md">
          {isSearching ? (
             <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" size={18} />
          ) : (
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          )}
          <input 
            type="text" 
            placeholder={`Buscar en ${activeTab === 'orders' ? 'órdenes' : activeTab === 'suppliers' ? 'proveedores' : 'recepciones'}...`} 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" 
            value={activeTab === 'orders' ? ordersSearch : activeTab === 'suppliers' ? supplierSearch : receivingSearch} 
            onChange={(e) => {
              if (activeTab === 'orders') setOrdersSearch(e.target.value);
              else if (activeTab === 'suppliers') setSupplierSearch(e.target.value);
              else setReceivingSearch(e.target.value);
            }} 
          />
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'orders' && <button onClick={() => handleOpenModal('order')} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all"><Plus size={18} /><span>Nueva Orden</span></button>}
          {activeTab === 'suppliers' && <button onClick={() => handleOpenModal('supplier')} className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition-all"><Plus size={18} /><span>Nuevo Proveedor</span></button>}
          {activeTab === 'receiving' && <button onClick={() => handleOpenModal('receive')} className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all"><CheckSquare size={18} /><span>Nueva Recepción</span></button>}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'orders' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Folio</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Proveedor</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Fecha ReCreación</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Total</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => (
                <tr key={order.id} className={`hover:bg-gray-50/50 transition-colors ${order.status === 'Cancelada' ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-8 py-5 font-black text-gray-900">
                    <div className="flex flex-col">
                      <span>{order.folio}</span>
                      {order.status === 'Cancelada' && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit mt-1">CANCELADA</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-gray-900">{order.supplier?.name}</p>
                    <p className="text-xs text-gray-400">{order.supplier?.rfc}</p>
                  </td>
                   <td className="px-8 py-5 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString('es-MX')}</td>
                  <td className="px-8 py-5 font-bold text-gray-900">${(order.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => { setSelectedOrder(order); setModalType('view_order'); setIsModalOpen(true); }} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-primary-100 transition-colors">Ver</button>
                        {order.status !== 'Cancelada' && (order.status === 'Pendiente' || order.status === 'Parcialmente Recepcionado') && (
                          <>
                             <button onClick={() => handleEditOrder(order)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                <Edit size={16} />
                             </button>
                             {order.status === 'Pendiente' && (
                               <button onClick={() => handleCancelOrder(order.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                  <Trash2 size={16} />
                               </button>
                             )}
                          </>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !isSearching && (
                <tr><td colSpan="5" className="py-20 text-center text-gray-400 font-medium">No se encontraron órdenes de compra.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'receiving' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Fecha</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">OC / Proveedor</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {receptions.map(rec => (
                <tr key={rec.id} className={`hover:bg-gray-50/50 transition-colors ${rec.status === 'Cancelada' ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-8 py-5 text-sm text-gray-500">
                     <div className="flex flex-col">
                        <span>{new Date(rec.created_at).toLocaleString('es-MX')}</span>
                        {rec.status === 'Cancelada' && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full w-fit mt-1">CANCELADA</span>}
                     </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-gray-900">{rec.purchase_order?.folio}</p>
                    <p className="text-xs text-gray-400">{rec.purchase_order?.supplier?.name}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => { setSelectedOrder(rec.purchase_order); setModalType('view_reception'); setIsModalOpen(true); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-colors">Ver</button>
                        {rec.status !== 'Cancelada' && (
                          <button onClick={() => handleCancelReception(rec.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                             <Trash2 size={16} />
                          </button>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
              {receptions.length === 0 && <tr><td colSpan="3" className="py-20 text-center text-gray-400">Sin recepciones registradas.</td></tr>}
            </tbody>
          </table>
        )}

        {activeTab === 'suppliers' && (
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Razón Social</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">RFC / Contacto</th>
                <th className="px-8 py-5 text-gray-500 font-bold text-xs uppercase tracking-wider">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {suppliers.map(sup => (
                <tr key={sup.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-gray-900">{sup.name}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm text-gray-500 font-mono">{sup.rfc || 'XAXX010101000'}</p>
                    <p className="text-xs text-gray-400 flex items-center"><Phone size={10} className="mr-1"/> {sup.phone || 'S/T'}</p>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500 truncate max-w-xs">{sup.address || '---'}</td>
                </tr>
              ))}
              {suppliers.length === 0 && !loadingSuppliers && (
                <tr><td colSpan="3" className="py-20 text-center text-gray-400 font-medium">No se encontraron proveedores.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center">
                {(modalType === 'order' || modalType === 'order_edit') && <><ShoppingBag className="mr-3 text-primary-600" /> {modalType === 'order_edit' ? 'Editar' : 'Nueva'} Orden de Compra</>}
                {modalType === 'supplier' && <><Factory className="mr-3 text-gray-900" /> Nuevo Proveedor Ferretero</>}
                {modalType === 'receive' && <><Truck className="mr-3 text-green-600" /> Recepción Detallada de Mercancía</>}
                {(modalType === 'view_order' || modalType === 'view_reception') && <><Calendar className="mr-3 text-primary-600" /> Consulta de Documento</>}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-400"><X size={20}/></button>
            </div>
            
            {(modalType === 'order' || modalType === 'order_edit') && (
              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div className="relative z-[110]">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Proveedor de Inventario</label>
                  <div className="relative">
                    <Factory className="absolute left-4 top-4 text-gray-400" size={20}/>
                    <input 
                      type="text" 
                      placeholder="Escribe la razón social o RFC..." 
                      className="w-full pl-12 pr-4 p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 border border-transparent focus:border-primary-500 shadow-sm"
                      value={orderSupplierSearchStr}
                      onChange={(e) => {
                        setOrderSupplierSearchStr(e.target.value);
                        setShowSupplierDropdown(true);
                        setOrderSupplierId('');
                      }}
                      onFocus={() => setShowSupplierDropdown(true)}
                    />
                  </div>
                  {showSupplierDropdown && orderSupplierSearchStr.length > 1 && (
                    <div className="absolute z-[120] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar flex flex-col">
                      {orderSupplierResults.map(sup => (
                           <button 
                             key={sup.id} 
                             type="button" 
                             onClick={() => {
                               setOrderSupplierId(sup.id);
                               setOrderSupplierSearchStr(`${sup.name} (${sup.rfc || 'Sin RFC'})`);
                               setShowSupplierDropdown(false);
                             }}
                             className="text-left px-5 py-4 hover:bg-primary-50 transition-colors border-b border-gray-100 flex flex-col group"
                           >
                             <span className="font-bold text-gray-900 group-hover:text-primary-700 text-sm mb-1">{sup.name}</span>
                             <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded shadow-sm w-fit group-hover:bg-primary-100 group-hover:text-primary-600">{sup.rfc || 'Sin RFC registrado'}</span>
                           </button>
                         ))
                      }
                      {orderSupplierResults.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-bold text-gray-500">Sin coincidencias.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 md:items-end">
                   <div className="flex-grow w-full relative">
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Buscador Inteligente de Productos</label>
                     <div className="relative">
                       <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                       <input 
                         type="text" 
                         placeholder="Ingresa múltiples palabras clave (ej: manguera truper 1/2)..." 
                         className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none border border-gray-200 focus:border-primary-500 transition-all font-bold text-gray-700 shadow-sm"
                         value={productSearchStr}
                         onChange={(e) => {
                           setProductSearchStr(e.target.value);
                           setShowProductDropdown(true);
                           setSelectedProductId('');
                           setSelectedProduct(null);
                         }}
                         onFocus={() => setShowProductDropdown(true)}
                       />
                     </div>
                     {showProductDropdown && productSearchStr.length > 1 && (
                       <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar flex flex-col">
                         {productSearchResults.map(p => (
                             <button 
                               key={p.id} 
                               type="button" 
                               onClick={() => {
                                 setSelectedProductId(p.id);
                                 setSelectedProduct(p);
                                 setProductSearchStr(`${p.legacy_code} - ${p.name}`);
                                 setOrderCost((parseFloat(p.cost || p.last_cost || 0) / 100).toFixed(2));
                                 setShowProductDropdown(false);
                               }}
                               className="text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b border-gray-100 flex items-center justify-between group"
                             >
                               <span className="font-bold text-gray-700 group-hover:text-primary-700 line-clamp-2 pr-2 text-sm">{p.name}</span>
                               <div className="flex flex-col items-end shrink-0 gap-1">
                                 <span className="text-[9px] font-black text-white uppercase bg-gray-400 group-hover:bg-primary-500 px-2 py-0.5 rounded-md shadow-sm">{p.legacy_code}</span>
                                 <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 whitespace-nowrap">Costo Reposición: ${((p.cost || p.last_cost || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                               </div>
                             </button>
                           ))
                         }
                         {productSearchResults.length === 0 && (
                           <div className="px-4 py-6 text-center">
                             <p className="text-sm font-bold text-gray-500">Sin resultados.</p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                   <div className="w-full md:w-40">
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Cantidad</label>
                     <input type="number" min="1" step="0.01" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} className="w-full p-3 bg-white rounded-xl outline-none border border-gray-200 focus:border-primary-500 font-black text-gray-700 text-center shadow-sm transition-all" />
                   </div>
                   <div className="w-full md:w-48">
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Costo U.</label>
                     <div className="relative">
                        <span className="absolute left-3 top-3 font-bold text-gray-400">$</span>
                        <input type="number" min="0" step="0.01" value={orderCost} onChange={(e) => setOrderCost(e.target.value)} className="w-full pl-8 pr-3 py-3 bg-white rounded-xl outline-none border border-gray-200 focus:border-primary-500 font-bold text-gray-700 shadow-sm transition-all" />
                     </div>
                   </div>
                   <button type="button" onClick={addItemToOrder} className="w-full md:w-auto px-8 py-3 bg-primary-100 text-primary-700 rounded-xl font-bold hover:bg-primary-200 transition-colors flex items-center justify-center whitespace-nowrap"><Plus size={18} className="mr-1"/> Añadir</button>
                </div>

                  <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 pt-4 border-t border-gray-100">
                     <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
                        <table className="w-full text-left">
                           <thead className="bg-gray-900 border-b border-gray-800">
                             <tr>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Artículo</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cant.</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Unit.</th>
                               <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                               <th className="px-6 py-4"></th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 bg-white">
                             {orderItems.map((item, idx) => (
                               <tr key={idx} className="hover:bg-gray-50/50">
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900 truncate max-w-[200px]">{item.product?.name}</p>
                                    <p className="text-[10px] text-gray-400">{item.product?.legacy_code}</p>
                                  </td>
                                  <td className="px-6 py-4 text-right font-black text-gray-700">{item.quantity}</td>
                                  <td className="px-6 py-4 text-right text-gray-500">${item.cost.toFixed(2)}</td>
                                  <td className="px-6 py-4 text-right font-black text-primary-600">${(item.quantity * item.cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button type="button" onClick={() => removeItemFromOrder(idx)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                  </td>
                               </tr>
                             ))}
                             {orderItems.length === 0 && (
                               <tr>
                                 <td colSpan="5" className="px-6 py-12 text-center text-sm font-bold text-gray-400 opacity-60">
                                   La orden está vacía. Usa el buscador superior para anexar piezas.
                                 </td>
                               </tr>
                             )}
                           </tbody>
                        </table>
                     </div>

                     <div className="flex flex-col items-end mb-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <div className="flex justify-between w-full md:w-64 mb-2"><span className="text-sm font-bold text-gray-500">Subtotal Artículo:</span><span className="text-sm font-bold text-gray-900">${orderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between w-full md:w-64 mb-4"><span className="text-sm font-bold text-gray-500">I.V.A. (16%):</span><span className="text-sm font-bold text-gray-900">${(orderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0) * 0.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between w-full md:w-64 pt-4 border-t border-gray-200"><span className="text-lg font-black text-gray-900">Total:</span><span className="text-2xl font-black text-primary-600 tracking-tighter">${(orderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0) * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
                     </div>

                     <button type="submit" disabled={orderItems.length === 0} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all ${orderItems.length > 0 ? "bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}><ShoppingBag size={18} className="mr-2"/> Emitir Orden Oficial</button>
                  </div>
              </form>
            )}

            {modalType === 'supplier' && (
              <form onSubmit={handleCreateSupplier} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre / Razón Social</label>
                    <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input required type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900" value={supplierForm.name} onChange={e=>setSupplierForm({...supplierForm, name: e.target.value})} /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">RFC</label>
                    <div className="relative"><Tag className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input required type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900" value={supplierForm.rfc} onChange={e=>setSupplierForm({...supplierForm, rfc: e.target.value.toUpperCase()})} /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                    <div className="relative"><Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900 shadow-sm" value={supplierForm.phone} onChange={e=>setSupplierForm({...supplierForm, phone: e.target.value})} /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Días de Crédito</label>
                    <div className="relative"><Calendar className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="number" min="0" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900 shadow-sm font-bold" value={supplierForm.credit_days} onChange={e=>setSupplierForm({...supplierForm, credit_days: parseInt(e.target.value) || 0})} /></div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                    <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <input type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900 shadow-sm" value={supplierForm.email} onChange={e=>setSupplierForm({...supplierForm, email: e.target.value})} /></div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Física</label>
                    <div className="relative"><Map className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <textarea className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-gray-900" value={supplierForm.address} onChange={e=>setSupplierForm({...supplierForm, address: e.target.value})} /></div>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center hover:bg-gray-800 shadow-xl transition-all">Registrar Proveedor</button>
              </form>
            )}

            {modalType === 'receive' && (
              <form onSubmit={handleConfirmReception} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seleccionar OC Pendiente o Parcial</label>
                  <select 
                    required
                    onChange={(e) => {
                      const order = orders.find(o => o.id === e.target.value);
                      setSelectedOrderForReception(order);
                      if (order) {
                        setReceptionWarehouseId(order.warehouse_id || '');
                        setReceptionItems(order.items.map(item => ({
                          product_id: item.product_id,
                          quantity: 0, 
                          pending: item.quantity - (item.quantity_received || 0),
                          name: item.product?.name,
                          legacy_code: item.product?.legacy_code
                        })));
                      }
                    }} 
                    className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-700 border border-transparent focus:border-green-500"
                  >
                    <option value="">-- Selecciona una OC --</option>
                    {orders.filter(o => o.status === 'Pendiente' || o.status === 'Parcialmente Recepcionado').map(o => (
                      <option key={o.id} value={o.id}>{o.folio} - {o.supplier?.name} ({o.status})</option>
                    ))}
                  </select>
                </div>

                {selectedOrderForReception && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Almacén de Entrada</label>
                           <div className="relative">
                              <MapPin className="absolute left-3 top-3 text-gray-400" size={18}/>
                              <select 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none border border-gray-200 focus:border-green-500 font-bold text-gray-700 shadow-sm"
                                value={receptionWarehouseId}
                                onChange={(e) => setReceptionWarehouseId(e.target.value)}
                              >
                                <option value="">-- Selecciona Almacén --</option>
                                {branches.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Personal que Recibe</label>
                           <div className="relative">
                              <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                              <select 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none border border-gray-200 focus:border-green-500 font-bold text-gray-700 shadow-sm"
                                value={receptionReceivedBy}
                                onChange={(e) => setReceptionReceivedBy(e.target.value)}
                              >
                                <option value="">-- Selecciona Almacenista --</option>
                                {almacenistas.map(u => (
                                  <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                           </div>
                        </div>
                     </div>

                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Cantidades a Recibir Hoy</p>
                     <div className="rounded-2xl border border-gray-100 overflow-hidden mb-6">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50">
                             <tr>
                               <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase">Producto</th>
                               <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Pendiente</th>
                               <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase text-center w-32">Recibir Ahora</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50 bg-white">
                              {receptionItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-green-50/30">
                                   <td className="px-5 py-4">
                                      <p className="font-bold text-gray-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{item.name}</p>
                                      <p className="text-[10px] text-gray-400">{item.legacy_code}</p>
                                   </td>
                                   <td className="px-5 py-4 text-right">
                                      <span className="text-sm font-black text-gray-600">{item.pending}</span>
                                   </td>
                                   <td className="px-5 py-4 text-center">
                                      <div className="relative">
                                        <input 
                                          type="number" 
                                          min="0"
                                          className={`w-24 p-2 rounded-xl text-center font-black outline-none border transition-all ${item.quantity > item.pending ? 'bg-orange-50 border-orange-300 text-orange-700' : (item.quantity > 0 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400 focus:border-green-500')}`}
                                          value={item.quantity} 
                                          onChange={(e) => {
                                            const newQty = parseInt(e.target.value) || 0;
                                            const updated = [...receptionItems];
                                            updated[idx].quantity = newQty;
                                            setReceptionItems(updated);
                                          }} 
                                        />
                                        {item.quantity > item.pending && (
                                          <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] text-white items-center justify-center font-bold">!</span>
                                          </div>
                                        )}
                                      </div>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     {receptionItems.some(i => i.quantity > i.pending) && (
                       <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3">
                         <div className="p-1.5 bg-orange-500 text-white rounded-lg shadow-sm">
                           <Tag size={16} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-orange-900">Excedente Detectado</p>
                            <p className="text-[10px] text-orange-700 leading-relaxed font-bold uppercase tracking-wide">Se está recibiendo más mercancía de la solicitada en la OC original. <br/>Esto generará un registro de inventario adicional.</p>
                         </div>
                       </div>
                     )}

                     <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 mb-6 flex flex-col items-center justify-center text-center">
                           <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1 italic">Total del Cargamento</p>
                           <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Valor Físico Recibido</p>
                           <p className="text-3xl font-black text-primary-600 tracking-tighter">
                             ${receptionItems.reduce((acc, item) => {
                               const poItem = selectedOrderForReception.items.find(i => i.product_id === item.product_id);
                               return acc + (item.quantity * (poItem?.cost || 0));
                             }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                           </p>
                           <p className="text-[10px] font-bold text-primary-400 mt-2">* Este valor será validado por Contabilidad al recibir la factura.</p>
                     </div>

                     <div className="mb-6">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones de la Entrega</label>
                        <textarea 
                          className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-green-500 min-h-[80px] text-sm font-bold text-gray-700" 
                          placeholder="Ej: Chofer entrega incompleta, mercancía con daño parcial en empaque..."
                          value={receptionObservations}
                          onChange={(e) => setReceptionObservations(e.target.value)}
                        />
                     </div>

                     <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-green-700 shadow-xl shadow-green-200 transition-all">
                       <CheckSquare size={18} className="mr-2" /> Confirmar Recepción Seleccionada
                     </button>
                  </div>
                )}
              </form>
            )}

            {(modalType === 'view_order' || modalType === 'view_reception') && selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Proveedor</p><h4 className="text-sm font-bold text-gray-900">{selectedOrder.supplier?.name}</h4></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Almacén</p><h4 className="text-sm font-bold text-primary-700">{selectedOrder.warehouse?.name || 'Sucursal Principal'}</h4></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Fecha</p><h4 className="text-sm font-bold text-gray-900">{new Date(selectedOrder.created_at).toLocaleString('es-MX')}</h4></div>
                  <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p><h4 className={`text-sm font-black uppercase ${selectedOrder.status === 'Recepcionado' ? 'text-green-600' : 'text-primary-600'}`}>{selectedOrder.status}</h4></div>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-gray-900">
                         <tr className="text-gray-400 text-[10px] font-black uppercase">
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4 text-right">Cant. Sol.</th>
                            <th className="px-6 py-4 text-right">Entregado</th>
                            <th className="px-6 py-4 text-right">Costo U.</th>
                            <th className="px-6 py-4 text-right">Total</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {selectedOrder.items?.map((item, idx) => (
                           <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                 <p className="font-bold text-gray-900">{item.product?.name}</p>
                                 <p className="text-[10px] text-gray-400">{item.product?.legacy_code}</p>
                              </td>
                              <td className="px-6 py-4 text-right font-black text-gray-400 italic">{item.quantity}</td>
                              <td className="px-6 py-4 text-right">
                                 <span className={`px-3 py-1 rounded-lg font-black text-sm ${item.quantity_received >= item.quantity ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                    {item.quantity_received || 0}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right text-gray-500">${(item.cost || 0).toFixed(2)}</td>
                              <td className="px-6 py-4 text-right font-black text-primary-600">${(item.quantity * (item.cost || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                </div>
                 <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-gray-100 gap-6">
                    <div className="flex flex-col items-center md:items-start p-6 bg-green-50 rounded-[2rem] border border-green-100 w-full md:w-auto">
                       <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1 italic">Total Físico Entregado</p>
                       <h3 className="text-3xl font-black text-green-700 tracking-tighter">
                          ${(selectedOrder.items?.reduce((acc, item) => acc + (item.quantity_received * (item.cost || 0)), 0) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                       </h3>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-end">
                       <p className="text-[10px] font-black text-primary-400 uppercase mb-1">Total Documento (OC)</p>
                       <h2 className="text-5xl font-black text-primary-700 tracking-tighter">
                          ${(selectedOrder.total_amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                       </h2>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases
