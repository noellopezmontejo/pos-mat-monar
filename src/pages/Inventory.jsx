import React, { useState, useEffect, useRef } from 'react'
import {
  Package, Search, Filter, Plus, X, ArrowUpRight, ArrowDownLeft, Calendar, Tag,
  Warehouse, MapPin, Edit, Trash2, CheckCircle2, ArrowRight, RefreshCw, Layers,
  ShoppingBag, FileText, Check, AlertCircle, FileDown, Printer
} from 'lucide-react'
import axios from 'axios'
import Barcode from 'react-barcode'
import { useCompany } from '../contexts/CompanyContext'


// Componente Autocomplete para Búsqueda Fina de Productos
const ProductSearchSelect = ({ value, onChange, placeholder = "Buscar producto...", filterFn }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // Cargar el producto seleccionado actualmente
  useEffect(() => {
    if (!value) {
      setSelectedProduct(null)
      setSearchTerm('')
      return
    }

    if (selectedProduct && selectedProduct.id === value) {
      return
    }

    const fetchSelectedProduct = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/products/${value}`, getHeaders())
        setSelectedProduct(res.data)
        setSearchTerm(res.data.name)
      } catch (e) {
        console.error('Error fetching selected product:', e)
      }
    }

    fetchSelectedProduct()
  }, [value, apiUrl])

  // Buscar productos cuando cambia el término de búsqueda y el dropdown está abierto
  useEffect(() => {
    if (!isOpen || !searchTerm.trim() || (selectedProduct && selectedProduct.name === searchTerm)) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${apiUrl}/api/products/search?query=${encodeURIComponent(searchTerm)}`, getHeaders())
        let filtered = res.data
        if (filterFn) {
          filtered = filtered.filter(filterFn)
        }
        setResults(filtered)
        setHighlightedIndex(-1)
      } catch (e) {
        console.error('Error searching products:', e)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, isOpen, selectedProduct, filterFn, apiUrl])

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        if (selectedProduct) {
          setSearchTerm(selectedProduct.name)
        } else {
          setSearchTerm('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedProduct])

  const handleSelect = (product) => {
    setSelectedProduct(product)
    setSearchTerm(product.name)
    setIsOpen(false)
    onChange(product)
  }

  const handleClear = () => {
    setSelectedProduct(null)
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    onChange(null)
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(results.length - 1, prev + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(0, prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      if (selectedProduct) {
        setSearchTerm(selectedProduct.name)
      } else {
        setSearchTerm('')
      }
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          className="w-full p-3 pr-10 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white text-sm font-semibold transition-all placeholder:text-gray-400 text-gray-800"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {selectedProduct ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
          >
            <X size={16} />
          </button>
        ) : (
          <Search size={16} className="absolute right-3 text-gray-400 pointer-events-none" />
        )}
      </div>

      {isOpen && (searchTerm.trim() !== '') && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[999] max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
          {loading ? (
            <div className="p-4 text-center text-xs font-semibold text-gray-400 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-primary-500" />
              <span>Buscando...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((product, index) => (
              <div
                key={product.id}
                onClick={() => handleSelect(product)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-4 py-3 cursor-pointer text-xs flex justify-between items-center transition-all ${
                  index === highlightedIndex ? 'bg-primary-50 text-primary-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <p className="font-bold uppercase tracking-tight">{product.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{product.legacy_code || 'SIN SKU'} {product.barcode ? `| EAN: ${product.barcode}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase tracking-widest">{product.base_unit || 'PZA'}</span>
                  <p className="text-[10px] text-primary-600 font-black mt-1">${((product.price_1 || 0) / 100).toFixed(2)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs font-semibold text-gray-400 flex items-center justify-center gap-2">
              <AlertCircle size={14} className="text-red-400" />
              <span>No se encontraron productos</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Inventory = () => {
  // Datos de Compañía
  const { profile } = useCompany()

  // Impresión de Etiquetas
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false)
  const [labelProduct, setLabelProduct] = useState(null)
  const [isPrintingLabels, setIsPrintingLabels] = useState(false)
  const [labelConfig, setLabelConfig] = useState({
    copies: 5,
    size: '80mm', // '80mm', '50x30mm'
    showName: true,
    showPrice: true,
    priceKey: 'price_1',
    showBarcode: true,
    showSKU: true,
    showCompany: true
  })

  // Estado General
  const [activeTab, setActiveTab] = useState('products') // 'products', 'transfers', 'conversions', 'kits', 'supplierReturns', 'customerReturns', 'branches'
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  // Catálogos e Insumos
  const [stock, setStock] = useState([])
  const [branches, setBranches] = useState([])
  const [categories, setCategories] = useState([])
  const [lines, setLines] = useState([])
  const [taxSchemes, setTaxSchemes] = useState([])
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [sales, setSales] = useState([])

  // Datos específicos de nuevos módulos
  const [transfers, setTransfers] = useState([])
  const [conversions, setConversions] = useState([])
  const [kits, setKits] = useState([])
  const [supplierReturns, setSupplierReturns] = useState([])
  const [customerReturns, setCustomerReturns] = useState([])

  // Modales de visualización original
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isKardexOpen, setIsKardexOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [kardexMovements, setKardexMovements] = useState([])
  const [loadingKardex, setLoadingKardex] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState('general')

  // Modales y formularios de Almacén (Branch)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [branchForm, setBranchForm] = useState({ name: '', address: '' })

  // MODALES NUEVOS
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false)
  const [isKitModalOpen, setIsKitModalOpen] = useState(false)
  const [isKitAssembleModalOpen, setIsKitAssembleModalOpen] = useState(false)
  const [isSupplierReturnModalOpen, setIsSupplierReturnModalOpen] = useState(false)
  const [isCustomerReturnModalOpen, setIsCustomerReturnModalOpen] = useState(false)

  // FORMULARIOS DE NUEVOS MÓDULOS
  const [transferForm, setTransferForm] = useState({
    origin_branch_id: '',
    dest_branch_id: '',
    notes: '',
    items: [] // { product_id: '', quantity: 1 }
  })

  const [conversionForm, setConversionForm] = useState({
    branch_id: '',
    source_product_id: '',
    target_product_id: '',
    source_quantity: 1
  })
  const [selectedSourceProduct, setSelectedSourceProduct] = useState(null)

  const [kitForm, setKitForm] = useState({
    name: '',
    barcode: '',
    category_id: '',
    price_1: 0,
    components: [] // { component_id: '', quantity: 1 }
  })

  const [kitAssembleForm, setKitAssembleForm] = useState({
    kit_product_id: '',
    branch_id: '',
    quantity: 1,
    is_disassembly: false
  })

  const [supplierReturnForm, setSupplierReturnForm] = useState({
    supplier_id: '',
    branch_id: '',
    notes: '',
    cfdi_egreso_uuid: '',
    cfdi_egreso_folio: '',
    items: [] // { product_id: '', quantity: 1, cost: 0 }
  })

  const [customerReturnForm, setCustomerReturnForm] = useState({
    customer_id: '',
    branch_id: '',
    sale_id: '',
    notes: '',
    issue_cfdi: false,
    items: [] // { product_id: '', quantity: 1, price: 0 }
  })

  // Ficha Maestra de Producto Form
  const [formData, setFormData] = useState({
    name: '', legacy_code: '', description: '', barcode: '', model: '',
    category_id: '', base_unit: 'PZA', purchase_unit: 'PZA', sale_unit: 'PZA', unit_factor: 1,
    weight: 0, volume: 0, tax_scheme_id: '', status: 'Activo',
    cost: 0, last_cost: 0, avg_cost: 0,
    p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
    min_stock: 0, max_stock: 0,
    has_lots: false, has_series: false, is_service: false,
    line_id: ''
  })

  // Headers de Autorización
  const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // APIS DE CATÁLOGOS BASE
  const fetchCategories = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/categories`, { headers: getAuthHeader() })
      setCategories(res.data)
      if (!selectedProduct && res.data.length > 0) {
        setFormData(prev => ({ ...prev, category_id: res.data[0]?.id || '' }))
        setKitForm(prev => ({ ...prev, category_id: res.data[0]?.id || '' }))
      }
    } catch (e) { console.error('Error fetching categories:', e) }
  }

  const fetchLines = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/lines`, { headers: getAuthHeader() })
      setLines(res.data)
    } catch (e) { console.error('Error fetching lines:', e) }
  }

  const fetchTaxSchemes = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/tax-schemes`, { headers: getAuthHeader() })
      setTaxSchemes(res.data)
    } catch (e) { console.error('Error fetching tax schemes:', e) }
  }

  const fetchBranches = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/branches`, { headers: getAuthHeader() })
      setBranches(res.data)
    } catch (e) { console.error('Error fetching branches:', e) }
  }

  const fetchCustomers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/customers`, { headers: getAuthHeader() })
      setCustomers(res.data)
    } catch (e) { console.error('Error fetching customers:', e) }
  }

  const fetchSuppliers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/suppliers`, { headers: getAuthHeader() })
      setSuppliers(res.data)
    } catch (e) { console.error('Error fetching suppliers:', e) }
  }

  const fetchSales = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/sales`, { headers: getAuthHeader() })
      setSales(res.data)
    } catch (e) { console.error('Error fetching sales:', e) }
  }

  const fetchProducts = async (query = '', pageNum = 1) => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const url = query 
        ? `${apiUrl}/api/products/search?query=${query}&page=${pageNum}`
        : `${apiUrl}/api/products`
      const res = await axios.get(url, { headers: getAuthHeader() })
      setStock(res.data)
    } catch (e) { 
      console.error(e) 
    } finally {
      setLoading(false)
    }
  }

  // APIS DE NUEVOS MÓDULOS DE INVENTARIO
  const fetchTransfers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/inventory-additions/transfers`, { headers: getAuthHeader() })
      setTransfers(res.data)
    } catch (e) { console.error('Error fetching transfers:', e) }
  }

  const fetchConversions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/inventory-additions/conversions`, { headers: getAuthHeader() })
      setConversions(res.data)
    } catch (e) { console.error('Error fetching conversions:', e) }
  }

  const fetchKits = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/inventory-additions/kits`, { headers: getAuthHeader() })
      setKits(res.data)
    } catch (e) { console.error('Error fetching kits:', e) }
  }

  const fetchSupplierReturns = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/inventory-additions/supplier-returns`, { headers: getAuthHeader() })
      setSupplierReturns(res.data)
    } catch (e) { console.error('Error fetching supplier returns:', e) }
  }

  const fetchCustomerReturns = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/inventory-additions/customer-returns`, { headers: getAuthHeader() })
      setCustomerReturns(res.data)
    } catch (e) { console.error('Error fetching customer returns:', e) }
  }

  // Inicialización de datos
  useEffect(() => {
    fetchLines()
    fetchTaxSchemes()
    fetchCategories()
    fetchBranches()
    fetchCustomers()
    fetchSuppliers()
    fetchSales()
    // Pre-cargar contadores para el nuevo panel de navegación
    fetchTransfers()
    fetchConversions()
    fetchKits()
    fetchSupplierReturns()
    fetchCustomerReturns()
  }, [])

  // Recarga al cambiar de Pestaña Activa
  useEffect(() => {
    if (activeTab === 'products') fetchProducts(searchQuery, page)
    if (activeTab === 'transfers') fetchTransfers()
    if (activeTab === 'conversions') fetchConversions()
    if (activeTab === 'kits') fetchKits()
    if (activeTab === 'supplierReturns') fetchSupplierReturns()
    if (activeTab === 'customerReturns') fetchCustomerReturns()
    if (activeTab === 'branches') fetchBranches()
  }, [activeTab, page])

  // Debounce para búsqueda en catálogo
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'products') {
        setPage(1)
        fetchProducts(searchQuery, 1)
      }
    }, 400)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // BÚSQUEDAS Y CONTROL DE KARDEX
  const fetchKardex = async (productId) => {
    setLoadingKardex(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.get(`${apiUrl}/api/products/${productId}/kardex`, { headers: getAuthHeader() })
      setKardexMovements(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingKardex(false)
    }
  }

  const openKardex = (product) => {
    setSelectedProduct(product)
    setIsKardexOpen(true)
    fetchKardex(product.id)
  }

  const openStockModal = (product) => {
    setSelectedProduct(product)
    setIsStockModalOpen(true)
  }

  const openLabelPrintModal = (product) => {
    setLabelProduct(product)
    setIsLabelModalOpen(true)
  }

  const handlePrintLabels = (e) => {
    e.preventDefault()
    setIsPrintingLabels(true)
    setTimeout(() => {
      window.print()
      setIsPrintingLabels(false)
    }, 500)
  }

  // HANDLERS CRUD PRODUCTOS
  const handleOpenModal = (product = null) => {
    setSelectedProduct(product)
    if (product) {
      setFormData({
        name: product.name || '',
        legacy_code: product.legacy_code || '',
        description: product.description || '',
        barcode: product.barcode || '',
        model: product.model || '',
        category_id: product.category_id || (categories[0]?.id || ''),
        base_unit: product.base_unit || 'PZA',
        purchase_unit: product.purchase_unit || 'PZA',
        sale_unit: product.sale_unit || 'PZA',
        unit_factor: product.unit_factor || 1,
        weight: product.weight || 0,
        volume: product.volume || 0,
        tax_scheme_id: product.tax_scheme_id || '',
        status: product.status || 'Activo',
        cost: (product.cost || 0) / 100,
        last_cost: (product.last_cost || 0) / 100,
        avg_cost: (product.avg_cost || 0) / 100,
        p1: (product.price_1 || 0) / 100,
        p2: (product.price_2 || 0) / 100,
        p3: (product.price_3 || 0) / 100,
        p4: (product.price_4 || 0) / 100,
        p5: (product.price_5 || 0) / 100,
        p6: (product.price_6 || 0) / 100,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        has_lots: !!product.has_lots,
        has_series: !!product.has_series,
        is_service: !!product.is_service,
        line_id: product.line_id || ''
      })
    } else {
      setFormData({
        name: '', legacy_code: '', description: '', barcode: '', model: '',
        category_id: categories[0]?.id || '', base_unit: 'PZA', purchase_unit: 'PZA', sale_unit: 'PZA', unit_factor: 1,
        weight: 0, volume: 0, tax_scheme_id: '', status: 'Activo',
        cost: 0, last_cost: 0, avg_cost: 0,
        p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
        min_stock: 0, max_stock: 0,
        has_lots: false, has_series: false, is_service: false,
        line_id: ''
      })
    }
    setActiveFormTab('general')
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const payload = {
        ...formData,
        price_1: Math.round(parseFloat(formData.p1) * 100),
        price_2: Math.round(parseFloat(formData.p2) * 100),
        price_3: Math.round(parseFloat(formData.p3) * 100),
        price_4: Math.round(parseFloat(formData.p4) * 100),
        price_5: Math.round(parseFloat(formData.p5) * 100),
        price_6: Math.round(parseFloat(formData.p6) * 100),
        cost: Math.round(parseFloat(formData.cost) * 100),
        last_cost: Math.round(parseFloat(formData.last_cost) * 100),
        avg_cost: Math.round(parseFloat(formData.avg_cost) * 100),
      }
      const hdrs = { headers: getAuthHeader() }
      if (selectedProduct?.id) {
        await axios.put(`${apiUrl}/api/products/${selectedProduct.id}`, payload, hdrs)
      } else {
        await axios.post(`${apiUrl}/api/products`, payload, hdrs)
      }
      setIsModalOpen(false)
      fetchProducts(searchQuery)
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || "Error al guardar el producto")
    }
  }

  // HANDLERS ALMACENES (BRANCHES)
  const handleOpenBranchModal = (branch = null) => {
    setSelectedBranch(branch)
    if (branch) {
      setBranchForm({ name: branch.name, address: branch.address || '' })
    } else {
      setBranchForm({ name: '', address: '' })
    }
    setIsBranchModalOpen(true)
  }

  const handleDeleteBranch = async (id) => {
    if (!confirm('¿Está seguro de eliminar este almacén? Se verificará que no tenga stock asociado.')) return
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.delete(`${apiUrl}/api/branches/${id}`, { headers: getAuthHeader() })
      fetchBranches()
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al eliminar almacén')
    }
  }

  const handleSaveBranch = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      if (selectedBranch) {
        await axios.put(`${apiUrl}/api/branches/${selectedBranch.id}`, branchForm, { headers: getAuthHeader() })
      } else {
        await axios.post(`${apiUrl}/api/branches`, branchForm, { headers: getAuthHeader() })
      }
      setIsBranchModalOpen(false)
      fetchBranches()
    } catch (e) {
      console.error(e)
      alert('Error al guardar almacén')
    }
  }

  // ACTIONS: TRASPASOS
  const handleCreateTransfer = async (e) => {
    e.preventDefault()
    if (transferForm.origin_branch_id === transferForm.dest_branch_id) {
      alert('El almacén de origen y destino no pueden ser iguales')
      return
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/inventory-additions/transfers`, transferForm, { headers: getAuthHeader() })
      setIsTransferModalOpen(false)
      fetchTransfers()
      alert('Traspaso enviado en tránsito con éxito')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al enviar traspaso')
    }
  }

  const handleReceiveTransfer = async (id) => {
    if (!confirm('¿Confirmar recepción completa de los productos en el almacén de destino?')) return
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/inventory-additions/transfers/${id}/receive`, {}, { headers: getAuthHeader() })
      fetchTransfers()
      alert('Traspaso marcado como recibido. Inventario actualizado en destino.')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al recibir traspaso')
    }
  }

  // ACTIONS: CONVERSIONES
  const handleConvertProduct = async (e) => {
    e.preventDefault()
    if (conversionForm.source_product_id === conversionForm.target_product_id) {
      alert('El producto origen y destino deben ser diferentes')
      return
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/inventory-additions/conversions`, conversionForm, { headers: getAuthHeader() })
      setIsConversionModalOpen(false)
      fetchConversions()
      alert('Conversión procesada con éxito. Inventario actualizado.')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al realizar conversión')
    }
  }

  // ACTIONS: KITS
  const handleCreateKit = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/inventory-additions/kits`, kitForm, { headers: getAuthHeader() })
      setIsKitModalOpen(false)
      fetchKits()
      alert('Kit de productos creado con éxito')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al crear el kit')
    }
  }

  const handleAssembleKit = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const endpoint = kitAssembleForm.is_disassembly ? 'disassemble' : 'assemble'
      await axios.post(`${apiUrl}/api/inventory-additions/kits/${endpoint}`, {
        kit_product_id: kitAssembleForm.kit_product_id,
        branch_id: kitAssembleForm.branch_id,
        quantity: parseInt(kitAssembleForm.quantity)
      }, { headers: getAuthHeader() })
      setIsKitAssembleModalOpen(false)
      fetchKits()
      alert(kitAssembleForm.is_disassembly ? 'Kit desensamblado correctamente' : 'Kit ensamblado correctamente')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al procesar ensamblaje')
    }
  }

  // ACTIONS: DEVOLUCIONES PROVEEDOR
  const handleCreateSupplierReturn = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      await axios.post(`${apiUrl}/api/inventory-additions/supplier-returns`, supplierReturnForm, { headers: getAuthHeader() })
      setIsSupplierReturnModalOpen(false)
      fetchSupplierReturns()
      alert('Devolución a proveedor registrada. Saldo conciliado en cuentas por pagar.')
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al guardar la devolución')
    }
  }

  // ACTIONS: DEVOLUCIONES CLIENTE
  const handleCreateCustomerReturn = async (e) => {
    e.preventDefault()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await axios.post(`${apiUrl}/api/inventory-additions/customer-returns`, customerReturnForm, { headers: getAuthHeader() })
      setIsCustomerReturnModalOpen(false)
      fetchCustomerReturns()
      if (customerReturnForm.issue_cfdi && res.data.cfdi_egreso) {
        alert(`Devolución registrada con éxito. ¡Nota de Crédito CFDI timbrada! UUID: ${res.data.cfdi_egreso.uuid}`)
      } else {
        alert('Devolución de cliente registrada físicamente con éxito.')
      }
    } catch (e) {
      console.error(e)
      alert(e.response?.data?.error || 'Error al guardar devolución de cliente')
    }
  }

  const tabList = [
    { 
      id: 'products', 
      label: 'Existencias', 
      desc: 'Catálogo de stock', 
      icon: Package, 
      count: stock.length,
      alertCount: stock.filter(item => {
        const totalStock = item.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0
        return totalStock <= (item.min_stock || 0)
      }).length,
      alertColor: 'bg-red-500 text-white animate-pulse'
    },
    { 
      id: 'transfers', 
      label: 'Traspasos', 
      desc: 'Movimientos sucursales', 
      icon: RefreshCw, 
      count: transfers.length,
      alertCount: transfers.filter(t => t.status === 'EN_TRANSITO').length,
      alertColor: 'bg-amber-500 text-white animate-pulse'
    },
    { 
      id: 'conversions', 
      label: 'Conversiones', 
      desc: 'Fraccionamiento de unidades', 
      icon: Layers, 
      count: conversions.length 
    },
    { 
      id: 'kits', 
      label: 'Kits', 
      desc: 'Agrupaciones y recetas', 
      icon: ShoppingBag, 
      count: kits.length 
    },
    { 
      id: 'supplierReturns', 
      label: 'Dev. Proveedor', 
      desc: 'Salidas a proveedor', 
      icon: ArrowDownLeft, 
      count: supplierReturns.length 
    },
    { 
      id: 'customerReturns', 
      label: 'Dev. Cliente', 
      desc: 'Ingreso y timbrado SAT', 
      icon: ArrowUpRight, 
      count: customerReturns.length 
    },
    { 
      id: 'branches', 
      label: 'Almacenes', 
      desc: 'Ubicaciones y sucursales', 
      icon: Warehouse, 
      count: branches.length 
    }
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm no-print">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary-600 rounded-2xl text-white shadow-lg shadow-primary-100">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Inventarios</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control Centralizado de Activos y Mermas</p>
          </div>
        </div>
      </div>

      {/* Navigation Card Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 no-print">
        {tabList.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex flex-col items-start p-4 rounded-[24px] border text-left transition-all duration-300 transform hover:-translate-y-0.5 ${
                isActive
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-transparent shadow-lg shadow-slate-900/10'
                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
              }`}
            >
              {/* Icon Container */}
              <div className={`p-2.5 rounded-xl mb-3 transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-50 text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600'
              }`}>
                <Icon size={18} />
              </div>

              {/* Badges / Indicators */}
              {(tab.alertCount !== undefined && tab.alertCount > 0) ? (
                <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${tab.alertColor}`}>
                  {tab.alertCount} {tab.id === 'products' ? 'Bajo' : 'Trans.'}
                </span>
              ) : tab.count !== undefined ? (
                <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-md text-[9px] font-bold ${
                  isActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              ) : null}

              {/* Typography */}
              <span className={`text-xs font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {tab.label}
              </span>
              <span className={`text-[9px] font-bold mt-1 leading-none ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                {tab.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* PESTAÑA: PRODUCTOS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU, marca o código..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
                <Plus size={18} />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider">Producto</th>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider">Línea</th>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider">Código / SKU</th>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider text-right">Precio</th>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider text-center">Existencia</th>
                    <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stock.map(item => {
                    const totalStock = item.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0
                    const isLow = totalStock <= (item.min_stock || 0)
                    return (
                      <tr key={item.id} className="hover:bg-primary-50/20 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary-600">
                              <Package size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.name}</h4>
                              <p className="text-[10px] text-gray-400 font-semibold">{item.barcode || 'SIN BARCODE'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-bold border border-blue-100">
                            {item.line?.name || 'GENÉRICO'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.legacy_code}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className="text-primary-600 font-bold">${((item.price_1 || 0) / 100).toFixed(2)}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => openStockModal(item)}
                            className={`inline-flex flex-col items-center p-2 rounded-xl border ${isLow ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                          >
                            <span className="text-sm font-black">{totalStock}</span>
                            <span className="text-[8px] font-bold uppercase">{item.base_unit}</span>
                          </button>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => openKardex(item)} className="p-2 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 rounded-xl transition-all" title="Kardex">
                              <Calendar size={16} />
                            </button>
                            <button onClick={() => openLabelPrintModal(item)} className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-xl transition-all" title="Imprimir Etiquetas">
                              <Tag size={16} />
                            </button>
                            <button onClick={() => handleOpenModal(item)} className="p-2 bg-primary-50 hover:bg-primary-600 hover:text-white text-primary-600 rounded-xl transition-all" title="Editar">
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA: TRASPASOS */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Traspasos entre Almacenes</h2>
            <button onClick={() => {
              setTransferForm({ origin_branch_id: '', dest_branch_id: '', notes: '', items: [] })
              setIsTransferModalOpen(true)
            }} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
              <Plus size={18} />
              <span>Nuevo Traspaso</span>
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Folio</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Origen</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Destino</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Estatus</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Productos</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transfers.map(tr => (
                  <tr key={tr.id} className="hover:bg-slate-50">
                    <td className="px-8 py-6 font-bold text-sm text-gray-900">{tr.folio}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{tr.origin_branch?.name}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{tr.dest_branch?.name}</td>
                    <td className="px-8 py-6">
                      <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${tr.status === 'RECIBIDO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {tr.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-600">
                      <ul className="list-disc list-inside">
                        {tr.items?.map(i => (
                          <li key={i.id}>{i.product?.name} (x{i.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {tr.status === 'EN_TRANSITO' && (
                        <button onClick={() => handleReceiveTransfer(tr.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 flex items-center gap-1.5 ml-auto">
                          <CheckCircle2 size={14} />
                          Recibir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: CONVERSIONES */}
      {activeTab === 'conversions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Conversiones de Unidad (Rollos a Metros, etc)</h2>
            <button onClick={() => {
              setConversionForm({ branch_id: '', source_product_id: '', target_product_id: '', source_quantity: 1 })
              setSelectedSourceProduct(null)
              setIsConversionModalOpen(true)
            }} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
              <Plus size={18} />
              <span>Nueva Conversión</span>
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Folio</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Almacén</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Origen Consumido</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Destino Generado</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Factor</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {conversions.map(c => (
                  <tr key={c.id}>
                    <td className="px-8 py-6 font-bold text-sm text-gray-900">{c.folio}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{c.branch?.name}</td>
                    <td className="px-8 py-6 text-sm text-red-600 font-bold">{c.source_product?.name} (-{c.source_quantity})</td>
                    <td className="px-8 py-6 text-sm text-green-600 font-bold">{c.target_product?.name} (+{c.target_quantity})</td>
                    <td className="px-8 py-6 text-sm font-mono text-gray-500">1x = {c.conversion_factor}</td>
                    <td className="px-8 py-6 text-sm text-gray-500">{c.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: KITS */}
      {activeTab === 'kits' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Kits y Agrupaciones de Productos</h2>
            <div className="flex gap-2">
              <button onClick={() => {
                setKitAssembleForm({ kit_product_id: '', branch_id: '', quantity: 1, is_disassembly: false })
                setIsKitAssembleModalOpen(true)
              }} className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all">
                <Layers size={18} />
                <span>Ensamblaje Físico</span>
              </button>
              <button onClick={() => {
                setKitForm({ name: '', barcode: '', category_id: categories[0]?.id || '', price_1: 0, components: [] })
                setIsKitModalOpen(true)
              }} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
                <Plus size={18} />
                <span>Definir Nuevo Kit</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Kit</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Código</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase text-right">Precio P1</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Componentes (Receta)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kits.map(kit => (
                  <tr key={kit.id}>
                    <td className="px-8 py-6 font-bold text-sm text-gray-900">{kit.name}</td>
                    <td className="px-8 py-6 font-mono text-xs text-gray-500">{kit.barcode || 'N/A'}</td>
                    <td className="px-8 py-6 text-right text-primary-600 font-bold">${((kit.price_1 || 0) / 100).toFixed(2)}</td>
                    <td className="px-8 py-6 text-xs text-gray-600">
                      <ul className="list-disc list-inside">
                        {kit.kit_components?.map(comp => (
                          <li key={comp.id}>{comp.component?.name} (Cant: {comp.quantity})</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: DEVOLUCIONES PROVEEDOR */}
      {activeTab === 'supplierReturns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Devoluciones a Proveedores</h2>
            <button onClick={() => {
              setSupplierReturnForm({ supplier_id: '', branch_id: '', notes: '', cfdi_egreso_uuid: '', cfdi_egreso_folio: '', items: [] })
              setIsSupplierReturnModalOpen(true)
            }} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
              <Plus size={18} />
              <span>Nueva Devolución Proveedor</span>
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Folio</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Proveedor</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Almacén</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Nota de Crédito (Proveedor)</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Productos</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {supplierReturns.map(sr => (
                  <tr key={sr.id}>
                    <td className="px-8 py-6 font-bold text-sm text-gray-900">{sr.folio}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{sr.supplier?.name}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{sr.branch?.name}</td>
                    <td className="px-8 py-6 text-xs text-gray-500 font-mono">
                      {sr.cfdi_egreso_folio ? `Folio: ${sr.cfdi_egreso_folio}` : 'N/A'}
                      {sr.cfdi_egreso_uuid && <span className="block text-[9px] text-gray-400">{sr.cfdi_egreso_uuid}</span>}
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-600">
                      <ul className="list-disc list-inside">
                        {sr.items?.map(i => (
                          <li key={i.id}>{i.product?.name} (x{i.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-500">{sr.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: DEVOLUCIONES CLIENTE */}
      {activeTab === 'customerReturns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Devoluciones de Clientes e Integración CFDI de Egreso</h2>
            <button onClick={() => {
              setCustomerReturnForm({ customer_id: '', branch_id: '', sale_id: '', notes: '', issue_cfdi: false, items: [] })
              setIsCustomerReturnModalOpen(true)
            }} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
              <Plus size={18} />
              <span>Nueva Devolución Cliente</span>
            </button>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Folio</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Cliente</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Almacén</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">CFDI Nota de Crédito (SAT)</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Productos</th>
                  <th className="px-8 py-6 text-gray-400 font-black text-[10px] uppercase">Archivos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customerReturns.map(cr => (
                  <tr key={cr.id}>
                    <td className="px-8 py-6 font-bold text-sm text-gray-900">{cr.folio}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{cr.customer?.name}</td>
                    <td className="px-8 py-6 text-sm text-gray-700">{cr.branch?.name}</td>
                    <td className="px-8 py-6 text-xs">
                      {cr.cfdi_egreso ? (
                        <div>
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 border border-green-100 rounded text-[9px]">TIMBRADO</span>
                          <span className="block font-mono text-[9px] text-gray-400 mt-1">{cr.cfdi_egreso.uuid}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-semibold italic">Sin Nota de Crédito</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-600">
                      <ul className="list-disc list-inside">
                        {cr.items?.map(i => (
                          <li key={i.id}>{i.product?.name} (x{i.quantity})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {cr.cfdi_egreso && (
                        <div className="flex gap-1 justify-end">
                          {cr.cfdi_egreso.pdf_url && (
                            <a href={cr.cfdi_egreso.pdf_url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700" title="Descargar PDF">
                              <FileDown size={14} />
                            </a>
                          )}
                          {cr.cfdi_egreso.xml_url && (
                            <a href={cr.cfdi_egreso.xml_url} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-700" title="Descargar XML">
                              <FileText size={14} />
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA: ALMACENES */}
      {activeTab === 'branches' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Warehouse className="text-primary-600" size={24} />
              Lista de Almacenes Registrados
            </h2>
            <button
              onClick={() => handleOpenBranchModal()}
              className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Nuevo Almacén</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map(branch => (
              <div key={branch.id} className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button onClick={() => handleOpenBranchModal(branch)} className="p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-colors shadow-sm">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteBranch(branch.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-start gap-5">
                  <div className="p-5 bg-slate-50 rounded-3xl text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <Warehouse size={32} />
                  </div>
                  <div className="flex-grow pt-1">
                    <h3 className="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-primary-700 transition-colors">{branch.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                      <MapPin size={16} className="shrink-0" />
                      <span className="line-clamp-2">{branch.address || 'Sin dirección registrada'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TRASPASO */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Crear Traspaso Multiproducto</h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateTransfer} className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sucursal Origen</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={transferForm.origin_branch_id} onChange={e => setTransferForm({ ...transferForm, origin_branch_id: e.target.value })}>
                    <option value="">Seleccione origen...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Sucursal Destino</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={transferForm.dest_branch_id} onChange={e => setTransferForm({ ...transferForm, dest_branch_id: e.target.value })}>
                    <option value="">Seleccione destino...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Notas / Observaciones</label>
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-xl min-h-[60px]" value={transferForm.notes} onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })} />
              </div>

              {/* Items a transferir */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Productos a Transferir</span>
                  <button type="button" onClick={() => setTransferForm({ ...transferForm, items: [...transferForm.items, { product_id: '', quantity: 1 }] })} className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus size={14} /> Añadir Producto
                  </button>
                </div>
                {transferForm.items.length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3 w-[70%]">Producto</th>
                          <th className="px-4 py-3 w-[20%] text-center">Cantidad</th>
                          <th className="px-4 py-3 w-[10%] text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transferForm.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/35 transition-colors">
                            <td className="px-4 py-2">
                              <ProductSearchSelect
                                value={item.product_id}
                                placeholder="Buscar producto..."
                                onChange={product => {
                                  const list = [...transferForm.items]
                                  list[idx].product_id = product ? product.id : ''
                                  setTransferForm({ ...transferForm, items: list })
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" required min="1" className="w-20 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" placeholder="Cant." value={item.quantity} onChange={e => {
                                const list = [...transferForm.items]
                                list[idx].quantity = parseInt(e.target.value) || 1
                                setTransferForm({ ...transferForm, items: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => {
                                const list = transferForm.items.filter((_, i) => i !== idx)
                                setTransferForm({ ...transferForm, items: list })
                              }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No hay productos agregados. Haz click en "Añadir Producto" para comenzar.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200">Enviar Traspaso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONVERSIÓN */}
      {isConversionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Nueva Conversión de Producto</h2>
              <button onClick={() => setIsConversionModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleConvertProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Sucursal / Almacén</label>
                <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={conversionForm.branch_id} onChange={e => setConversionForm({ ...conversionForm, branch_id: e.target.value })}>
                  <option value="">Seleccione...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Producto Origen (Ej. Rollo)</label>
                  <ProductSearchSelect
                    value={conversionForm.source_product_id}
                    placeholder="Buscar origen..."
                    filterFn={p => !p.is_kit}
                    onChange={product => {
                      setConversionForm({ ...conversionForm, source_product_id: product ? product.id : '' })
                      setSelectedSourceProduct(product)
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Producto Destino (Ej. Metros)</label>
                  <ProductSearchSelect
                    value={conversionForm.target_product_id}
                    placeholder="Buscar destino..."
                    filterFn={p => !p.is_kit}
                    onChange={product => setConversionForm({ ...conversionForm, target_product_id: product ? product.id : '' })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cantidad Origen a Convertir</label>
                <input type="number" required min="1" className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-lg" value={conversionForm.source_quantity} onChange={e => setConversionForm({ ...conversionForm, source_quantity: parseInt(e.target.value) || 1 })} />
              </div>

              {/* Vista preliminar del cálculo */}
              {(() => {
                const src = selectedSourceProduct
                const factor = src?.unit_factor || 1
                return (
                  <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex items-center justify-between text-xs text-primary-700">
                    <div>
                      <p className="font-bold">Equivalencia del Producto Origen:</p>
                      <p>1 {src?.base_unit || 'PZA'} = {factor} unidades de venta.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Estimado Destino:</p>
                      <p className="text-lg font-black text-primary-800">+{conversionForm.source_quantity * factor}</p>
                    </div>
                  </div>
                )
              })()}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsConversionModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">Procesar Conversión</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEFINIR KIT */}
      {isKitModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Definir Receta de Kit de Productos</h2>
              <button onClick={() => setIsKitModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateKit} className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Comercial del Kit</label>
                <input required type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl" placeholder="Ej. Kit Herramientas Básico" value={kitForm.name} onChange={e => setKitForm({ ...kitForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Código de Barras</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl" placeholder="EAN-13" value={kitForm.barcode} onChange={e => setKitForm({ ...kitForm, barcode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Precio Sugerido P1</label>
                  <input type="number" step="0.01" className="w-full p-3 bg-gray-50 border-none rounded-xl" placeholder="0.00" value={kitForm.price_1} onChange={e => setKitForm({ ...kitForm, price_1: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Categoría</label>
                <select className="w-full p-3 bg-gray-50 border-none rounded-xl" value={kitForm.category_id} onChange={e => setKitForm({ ...kitForm, category_id: e.target.value })}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Componentes */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Componentes del Kit</span>
                  <button type="button" onClick={() => setKitForm({ ...kitForm, components: [...kitForm.components, { component_id: '', quantity: 1 }] })} className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus size={14} /> Añadir Componente
                  </button>
                </div>
                {kitForm.components.length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3 w-[70%]">Componente</th>
                          <th className="px-4 py-3 w-[20%] text-center">Cantidad</th>
                          <th className="px-4 py-3 w-[10%] text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {kitForm.components.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/35 transition-colors">
                            <td className="px-4 py-2">
                              <ProductSearchSelect
                                value={comp.component_id}
                                placeholder="Buscar componente..."
                                filterFn={p => !p.is_kit}
                                onChange={product => {
                                  const list = [...kitForm.components]
                                  list[idx].component_id = product ? product.id : ''
                                  setKitForm({ ...kitForm, components: list })
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" required min="1" className="w-20 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" value={comp.quantity} onChange={e => {
                                const list = [...kitForm.components]
                                list[idx].quantity = parseInt(e.target.value) || 1
                                setKitForm({ ...kitForm, components: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => {
                                const list = kitForm.components.filter((_, i) => i !== idx)
                                setKitForm({ ...kitForm, components: list })
                              }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No hay componentes agregados. Haz click en "Añadir Componente" para comenzar.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsKitModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Descartar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">Definir Receta Kit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENSAMBLAJE/DESENSAMBLAJE KIT */}
      {isKitAssembleModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">{kitAssembleForm.is_disassembly ? 'Desensamblar Kit' : 'Ensamblaje Físico de Kits'}</h2>
              <button onClick={() => setIsKitAssembleModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleAssembleKit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Acción</label>
                <select className="w-full p-3 bg-gray-50 border-none rounded-xl" value={kitAssembleForm.is_disassembly ? 'true' : 'false'} onChange={e => setKitAssembleForm({ ...kitAssembleForm, is_disassembly: e.target.value === 'true' })}>
                  <option value="false">Ensamblar (Consumir componentes =&gt; Agregar Kit)</option>
                  <option value="true">Desensamblar (Consumir Kit =&gt; Devolver componentes)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Kit a Modificar</label>
                <ProductSearchSelect
                  value={kitAssembleForm.kit_product_id}
                  placeholder="Buscar kit..."
                  filterFn={p => p.is_kit}
                  onChange={product => setKitAssembleForm({ ...kitAssembleForm, kit_product_id: product ? product.id : '' })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Sucursal / Almacén</label>
                <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={kitAssembleForm.branch_id} onChange={e => setKitAssembleForm({ ...kitAssembleForm, branch_id: e.target.value })}>
                  <option value="">Seleccione...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cantidad de Kits</label>
                <input type="number" required min="1" className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold" value={kitAssembleForm.quantity} onChange={e => setKitAssembleForm({ ...kitAssembleForm, quantity: parseInt(e.target.value) || 1 })} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsKitAssembleModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">{kitAssembleForm.is_disassembly ? 'Ejecutar Desensamblaje' : 'Ejecutar Ensamblaje'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEVOLUCIÓN PROVEEDOR */}
      {isSupplierReturnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Devolución a Proveedor</h2>
              <button onClick={() => setIsSupplierReturnModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateSupplierReturn} className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Proveedor</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={supplierReturnForm.supplier_id} onChange={e => setSupplierReturnForm({ ...supplierReturnForm, supplier_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Almacén Origen</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={supplierReturnForm.branch_id} onChange={e => setSupplierReturnForm({ ...supplierReturnForm, branch_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Folio Nota de Crédito Proveedor</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl" placeholder="Ej. NC-10928" value={supplierReturnForm.cfdi_egreso_folio} onChange={e => setSupplierReturnForm({ ...supplierReturnForm, cfdi_egreso_folio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">UUID Nota de Crédito Proveedor</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border-none rounded-xl font-mono text-xs" placeholder="UUID del SAT" value={supplierReturnForm.cfdi_egreso_uuid} onChange={e => setSupplierReturnForm({ ...supplierReturnForm, cfdi_egreso_uuid: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Notas / Razón de la Devolución</label>
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-xl min-h-[60px]" placeholder="Ej. Defectos de fábrica..." value={supplierReturnForm.notes} onChange={e => setSupplierReturnForm({ ...supplierReturnForm, notes: e.target.value })} />
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Productos a devolver</span>
                  <button type="button" onClick={() => setSupplierReturnForm({ ...supplierReturnForm, items: [...supplierReturnForm.items, { product_id: '', quantity: 1, cost: 0 }] })} className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus size={14} /> Añadir Producto
                  </button>
                </div>
                {supplierReturnForm.items.length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3 w-[50%]">Producto</th>
                          <th className="px-4 py-3 w-[20%] text-center">Cantidad</th>
                          <th className="px-4 py-3 w-[20%] text-center">Costo Unit.</th>
                          <th className="px-4 py-3 w-[10%] text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {supplierReturnForm.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/35 transition-colors">
                            <td className="px-4 py-2">
                              <ProductSearchSelect
                                value={item.product_id}
                                placeholder="Buscar producto..."
                                onChange={product => {
                                  const list = [...supplierReturnForm.items]
                                  list[idx].product_id = product ? product.id : ''
                                  if (product) {
                                    list[idx].cost = (product.cost || 0) / 100
                                  } else {
                                    list[idx].cost = 0
                                  }
                                  setSupplierReturnForm({ ...supplierReturnForm, items: list })
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" required min="1" className="w-20 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" placeholder="Cant." value={item.quantity} onChange={e => {
                                const list = [...supplierReturnForm.items]
                                list[idx].quantity = parseInt(e.target.value) || 1
                                setSupplierReturnForm({ ...supplierReturnForm, items: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" step="0.01" required className="w-24 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" placeholder="Costo" value={item.cost} onChange={e => {
                                const list = [...supplierReturnForm.items]
                                list[idx].cost = parseFloat(e.target.value) || 0
                                setSupplierReturnForm({ ...supplierReturnForm, items: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => {
                                const list = supplierReturnForm.items.filter((_, i) => i !== idx)
                                setSupplierReturnForm({ ...supplierReturnForm, items: list })
                              }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No hay productos agregados. Haz click en "Añadir Producto" para comenzar.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsSupplierReturnModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">Registrar Devolución</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DEVOLUCIÓN CLIENTE */}
      {isCustomerReturnModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">Devolución de Cliente y Timbrado SAT</h2>
              <button onClick={() => setIsCustomerReturnModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateCustomerReturn} className="p-6 overflow-y-auto space-y-4 flex-grow custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Cliente</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={customerReturnForm.customer_id} onChange={e => setCustomerReturnForm({ ...customerReturnForm, customer_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Almacén Destino</label>
                  <select required className="w-full p-3 bg-gray-50 border-none rounded-xl" value={customerReturnForm.branch_id} onChange={e => setCustomerReturnForm({ ...customerReturnForm, branch_id: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Venta Original Relacionada (Opcional, para Nota de Crédito)</label>
                <select className="w-full p-3 bg-gray-50 border-none rounded-xl" value={customerReturnForm.sale_id} onChange={e => {
                  const saleId = e.target.value
                  const selectedSale = sales.find(s => s.id === saleId)
                  let itemsList = []
                  if (selectedSale) {
                    itemsList = selectedSale.items.map(item => ({
                      product_id: item.product_id,
                      quantity: item.quantity,
                      price: (item.price || 0) / 100
                    }))
                  }
                  setCustomerReturnForm({ ...customerReturnForm, sale_id: saleId, items: itemsList })
                }}>
                  <option value="">Seleccione la venta...</option>
                  {sales.filter(s => s.customer_id === customerReturnForm.customer_id).map(s => (
                    <option key={s.id} value={s.id}>{s.folio} - Total: ${(s.total_amount / 100).toFixed(2)} - ({new Date(s.created_at).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Notas / Motivo</label>
                <textarea className="w-full p-3 bg-gray-50 border-none rounded-xl min-h-[60px]" placeholder="Ej. Garantía, insatisfacción..." value={customerReturnForm.notes} onChange={e => setCustomerReturnForm({ ...customerReturnForm, notes: e.target.value })} />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <input type="checkbox" id="issue_cfdi" className="w-5 h-5 accent-primary-600 rounded" checked={customerReturnForm.issue_cfdi} onChange={e => setCustomerReturnForm({ ...customerReturnForm, issue_cfdi: e.target.checked })} />
                <label htmlFor="issue_cfdi" className="text-xs font-black text-slate-700 cursor-pointer">
                  Timbrar Nota de Crédito CFDI de Egreso (Venta relacionada debe estar Facturada)
                </label>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wider">Productos devueltos</span>
                  <button type="button" onClick={() => setCustomerReturnForm({ ...customerReturnForm, items: [...customerReturnForm.items, { product_id: '', quantity: 1, price: 0 }] })} className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
                    <Plus size={14} /> Añadir Producto
                  </button>
                </div>
                {customerReturnForm.items.length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-visible shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-3 w-[50%]">Producto</th>
                          <th className="px-4 py-3 w-[20%] text-center">Cantidad</th>
                          <th className="px-4 py-3 w-[20%] text-center">Precio Unit.</th>
                          <th className="px-4 py-3 w-[10%] text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {customerReturnForm.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/35 transition-colors">
                            <td className="px-4 py-2">
                              <ProductSearchSelect
                                value={item.product_id}
                                placeholder="Buscar producto devuelto..."
                                onChange={product => {
                                  const list = [...customerReturnForm.items]
                                  list[idx].product_id = product ? product.id : ''
                                  if (product) {
                                    list[idx].price = (product.price_1 || 0) / 100
                                  } else {
                                    list[idx].price = 0
                                  }
                                  setCustomerReturnForm({ ...customerReturnForm, items: list })
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" required min="1" className="w-20 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" placeholder="Cant." value={item.quantity} onChange={e => {
                                const list = [...customerReturnForm.items]
                                list[idx].quantity = parseInt(e.target.value) || 1
                                setCustomerReturnForm({ ...customerReturnForm, items: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="number" step="0.01" required className="w-24 p-2.5 bg-gray-50 border-none rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" placeholder="Precio" value={item.price} onChange={e => {
                                const list = [...customerReturnForm.items]
                                list[idx].price = parseFloat(e.target.value) || 0
                                setCustomerReturnForm({ ...customerReturnForm, items: list })
                              }} />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => {
                                const list = customerReturnForm.items.filter((_, i) => i !== idx)
                                setCustomerReturnForm({ ...customerReturnForm, items: list })
                              }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    No hay productos devueltos. Haz click en "Añadir Producto" para comenzar.
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCustomerReturnModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">Registrar Devolución</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHA MAESTRA PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-0 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl transition-all">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ficha Maestra de Producto</h2>
                <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-widest">Estándar SAE / Control de Activos</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-red-50 hover:text-red-500 transition-all rounded-2xl text-gray-400 group border border-transparent hover:border-red-100 flex items-center justify-center">
                <X size={28} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex bg-white px-2 pt-2">
              {[
                { id: 'general', label: 'General', icon: <Package size={18}/> },
                { id: 'prices', label: 'Económicos', icon: <Tag size={18}/> },
                { id: 'logistics', label: 'Logística', icon: <ArrowUpRight size={18}/> },
                { id: 'control', label: 'Control', icon: <Filter size={18}/> }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-3 py-5 font-black text-xs uppercase tracking-widest transition-all rounded-t-[24px] ${activeFormTab === tab.id ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-10 bg-white custom-scrollbar">
              {activeFormTab === 'general' && (
                <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="col-span-2">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Nombre / Descripción Comercial</label>
                       <input required type="text" className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-primary-500 focus:bg-white font-bold text-slate-900 text-lg transition-all" placeholder="Ej. Martillo de Uña Curva 16oz" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">SKU / Código Interno</label>
                       <input required type="text" className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-primary-500 focus:bg-white font-mono font-bold text-slate-900" placeholder="SKU-001" value={formData.legacy_code} onChange={e=>setFormData({...formData, legacy_code: e.target.value})} />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Línea de Negocio</label>
                       <select className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-primary-500 focus:bg-white font-bold text-slate-700" value={formData.line_id} onChange={e => setFormData({...formData, line_id: e.target.value})}>
                          <option value="">Seleccione Línea...</option>
                          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       </select>
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Descripción Técnica Prolongada</label>
                       <textarea className="w-full p-5 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-primary-500 focus:bg-white min-h-[120px] font-medium text-slate-700 leading-relaxed" placeholder="Especificaciones, material, procedencia..." value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {activeFormTab === 'prices' && (
                <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-top-2">
                   <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-1 p-8 bg-primary-50 rounded-[32px] border-2 border-primary-100 shadow-sm">
                       <label className="block text-[10px] font-black text-primary-600 uppercase tracking-widest mb-3">Costo Unitario Base</label>
                       <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-primary-600">$</span>
                         <input required type="number" step="0.01" className="w-full pl-10 p-5 bg-white rounded-2xl outline-none border-2 border-transparent focus:border-primary-500 font-black text-primary-900 text-2xl" value={formData.cost} onChange={e=>setFormData({...formData, cost: e.target.value})} />
                       </div>
                    </div>
                    <div className="col-span-2 p-8 bg-slate-900 rounded-[32px] shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                       <h3 className="text-white font-black text-sm mb-6 flex items-center uppercase tracking-[0.2em]"><Tag className="mr-3 text-primary-400" /> Matriz de Precios</h3>
                       <div className="grid grid-cols-2 gap-6">
                          {[1,2].map(num => (
                            <div key={num}>
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Precio de Lista {num}</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary-400">$</span>
                                <input required type="number" step="0.01" className="w-full pl-8 p-4 bg-slate-800 rounded-xl outline-none text-white font-black border border-transparent focus:border-primary-500 transition-all" value={formData[`p${num}`]} onChange={e=>setFormData({...formData, [`p${num}`]: e.target.value})} />
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                   </div>
                </div>
              )}

              {activeFormTab === 'logistics' && (
                 <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-top-2">
                    <div className="bg-slate-50 p-10 rounded-[40px] border border-slate-100 grid grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest underline decoration-primary-500 decoration-4 underline-offset-8">Unidad de Medida</label>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase">Compra</p>
                                <input type="text" className="w-full p-4 bg-white rounded-2xl font-black text-slate-800 border border-slate-200" value={formData.purchase_unit} onChange={e=>setFormData({...formData, purchase_unit: e.target.value})} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-500 mb-2 uppercase">Venta</p>
                                <input type="text" className="w-full p-4 bg-white rounded-2xl font-black text-slate-800 border border-slate-200" value={formData.base_unit} onChange={e=>setFormData({...formData, base_unit: e.target.value})} />
                             </div>
                          </div>
                       </div>
                       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
                            <div className="p-5 bg-primary-50 text-primary-600 rounded-2xl">
                               <Package size={32} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-400 uppercase mb-1">Factor Equivalencia (unit_factor)</p>
                               <div className="flex items-center gap-4">
                                  <input type="number" className="w-20 p-3 bg-slate-50 rounded-xl font-black text-xl text-primary-600 text-center" value={formData.unit_factor} onChange={e=>setFormData({...formData, unit_factor: parseFloat(e.target.value) || 1})} />
                                  <span className="text-sm font-bold text-slate-600">x {formData.base_unit}</span>
                               </div>
                            </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeFormTab === 'control' && (
                 <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {[
                         { id: 'has_lots', label: 'Gestión de Lotes', icon: <Filter/> },
                         { id: 'has_series', label: 'Series Únicas', icon: <Package/> },
                         { id: 'is_service', label: 'Art. de Servicio', icon: <ArrowUpRight/> }
                       ].map(opt => (
                         <button key={opt.id} type="button" onClick={() => setFormData({...formData, [opt.id]: !formData[opt.id]})} className={`p-8 rounded-[36px] border-4 transition-all flex flex-col items-center text-center ${formData[opt.id] ? 'bg-primary-50 border-primary-500 shadow-xl' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-4 transition-all ${formData[opt.id] ? 'bg-primary-600 text-white rotate-6' : 'bg-slate-50 text-slate-400'}`}>
                               {opt.icon}
                            </div>
                            <h4 className={`text-sm font-black uppercase tracking-widest ${formData[opt.id] ? 'text-primary-700' : 'text-slate-900'}`}>{opt.label}</h4>
                         </button>
                       ))}
                    </div>
                 </div>
              )}
              
              <div className="mt-12 flex justify-end items-center gap-4 sticky bottom-0 bg-white pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                <button type="submit" className="px-16 py-5 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-primary-400" />
                  <span>Sincronizar Maestro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KARDEX DETAIL MODAL */}
      {isKardexOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center">
                  <Calendar className="mr-3 text-primary-600" /> Historial de Kardex
                </h2>
                <p className="text-gray-500 font-medium mt-1">{selectedProduct.name} ({selectedProduct.legacy_code})</p>
              </div>
              <button onClick={() => setIsKardexOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <div className="flex-grow overflow-auto p-6 bg-white custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border border-gray-100 rounded-xl">
                  <tr>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase">Fecha</th>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase">Tipo</th>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase">Detalle / Concepto</th>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase">Almacén</th>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase text-right">Cant.</th>
                    <th className="px-6 py-4 text-gray-500 font-bold text-xs uppercase text-right">Saldo Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingKardex ? (
                    <tr><td colSpan="6" className="py-10 text-center text-gray-400">Cargando movimientos...</td></tr>
                  ) : kardexMovements.length === 0 ? (
                    <tr><td colSpan="6" className="py-10 text-center text-gray-400">No hay movimientos registrados.</td></tr>
                  ) : (
                    kardexMovements.map(mov => (
                      <tr key={mov.id} className="hover:bg-gray-50/50 text-sm">
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(mov.created_at).toLocaleString('es-MX')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase ${mov.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {mov.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {mov.reason}
                          {mov.reference && <span className="block text-[10px] text-gray-400">REF: {mov.reference}</span>}
                        </td>
                        <td className="px-6 py-4 text-primary-600 font-bold">{mov.branch?.name || 'Matriz'}</td>
                        <td className={`px-6 py-4 font-bold text-right ${mov.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900 text-right text-base">{mov.balance}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STOCK BY BRANCH MODAL */}
      {isStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-black text-gray-900">Existencias por Almacén</h2>
                <p className="text-gray-500 font-medium mt-1">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsStockModalOpen(false)} className="p-2 text-gray-400 hover:text-red-500 rounded-full border border-gray-200"><X size={20}/></button>
            </div>
            <div className="p-6">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-gray-500 font-bold text-xs uppercase">Almacén</th>
                    <th className="px-6 py-3 text-gray-500 font-bold text-xs uppercase text-right">Existencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(!selectedProduct.stock || selectedProduct.stock.length === 0) ? (
                    <tr><td colSpan="2" className="py-6 text-center text-gray-400">Sin existencias registradas.</td></tr>
                  ) : (
                    selectedProduct.stock.map(s => (
                      <tr key={s.id} className="text-sm">
                        <td className="px-6 py-4 font-bold text-gray-800">{s.branch?.name}</td>
                        <td className="px-6 py-4 text-primary-600 font-black text-right text-base">
                          {s.quantity} <span className="text-xs font-normal text-gray-400">{selectedProduct.base_unit}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR ALMACÉN */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">{selectedBranch ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
              <button onClick={() => setIsBranchModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-full border border-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nombre Almacén</label>
                <input required type="text" className="w-full p-3 bg-slate-50 border-none rounded-xl" placeholder="Ej. Saltillo Matriz" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Dirección / Ubicación</label>
                <textarea className="w-full p-3 bg-slate-50 border-none rounded-xl min-h-[80px]" placeholder="Dirección completa" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsBranchModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-bold">{selectedBranch ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPRIMIR ETIQUETAS */}
      {isLabelModalOpen && labelProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Cabecera */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Printer className="text-emerald-600" size={22} />
                  Impresión de Etiquetas de Producto
                </h2>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">
                  Código de Barras y Precios
                </p>
              </div>
              <button 
                onClick={() => setIsLabelModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-red-500 rounded-full border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo */}
            <form onSubmit={handlePrintLabels} className="p-8 overflow-y-auto flex-grow flex flex-col md:flex-row gap-8 custom-scrollbar">
              {/* Controles de Configuración */}
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                    Cantidad de Etiquetas (Copias)
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    max="500" 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all text-slate-800 text-lg" 
                    value={labelConfig.copies} 
                    onChange={e => setLabelConfig({ ...labelConfig, copies: parseInt(e.target.value) || 1 })} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                      Tamaño de Etiqueta
                    </label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                      value={labelConfig.size}
                      onChange={e => setLabelConfig({ ...labelConfig, size: e.target.value })}
                    >
                      <option value="80mm">Rollo Continuo (80mm)</option>
                      <option value="50x30mm">Etiqueta Chica (50x30mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                      Nivel de Precio
                    </label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all"
                      value={labelConfig.priceKey}
                      onChange={e => setLabelConfig({ ...labelConfig, priceKey: e.target.value })}
                    >
                      <option value="price_1">Precio 1 (Público): ${(labelProduct.price_1 / 100).toFixed(2)}</option>
                      {labelProduct.price_2 > 0 && <option value="price_2">Precio 2: ${(labelProduct.price_2 / 100).toFixed(2)}</option>}
                      {labelProduct.price_3 > 0 && <option value="price_3">Precio 3: ${(labelProduct.price_3 / 100).toFixed(2)}</option>}
                      {labelProduct.price_4 > 0 && <option value="price_4">Precio 4: ${(labelProduct.price_4 / 100).toFixed(2)}</option>}
                      {labelProduct.price_5 > 0 && <option value="price_5">Precio 5: ${(labelProduct.price_5 / 100).toFixed(2)}</option>}
                      {labelProduct.price_6 > 0 && <option value="price_6">Precio 6: ${(labelProduct.price_6 / 100).toFixed(2)}</option>}
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    Personalización visual
                  </span>

                  {[
                    { key: 'showCompany', label: 'Mostrar nombre de la empresa' },
                    { key: 'showName', label: 'Mostrar nombre del producto' },
                    { key: 'showSKU', label: 'Mostrar código / SKU' },
                    { key: 'showBarcode', label: 'Mostrar código de barras' },
                    { key: 'showPrice', label: 'Mostrar precio' }
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                        checked={labelConfig[item.key]} 
                        onChange={e => setLabelConfig({ ...labelConfig, [item.key]: e.target.checked })} 
                      />
                      <span className="text-xs font-black text-slate-600 group-hover:text-slate-900 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vista Preliminar */}
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-3xl min-h-[300px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Vista Previa (En Pantalla)
                </p>
                <div 
                  className="bg-white border-2 border-slate-200 rounded-2xl shadow-md p-4 font-mono text-center flex flex-col items-center justify-center text-black relative"
                  style={{ 
                    width: labelConfig.size === '50x30mm' ? '220px' : '280px',
                    minHeight: labelConfig.size === '50x30mm' ? '140px' : '190px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {/* Bordes redondeados y simulación de etiqueta */}
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-100 border border-slate-200"></div>
                  
                  {labelConfig.showCompany && (
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 truncate max-w-full">
                      {profile?.trade_name || profile?.name || 'CIMENTA'}
                    </div>
                  )}
                  {labelConfig.showName && (
                    <div className="text-[11px] font-black uppercase leading-tight max-w-[95%] line-clamp-2 mb-1">
                      {labelProduct.name}
                    </div>
                  )}
                  {labelConfig.showSKU && (
                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                      SKU: {labelProduct.legacy_code}
                    </div>
                  )}
                  {labelConfig.showBarcode && (labelProduct.barcode || labelProduct.legacy_code) && (
                    <div className="my-1.5 flex justify-center w-full overflow-hidden">
                      <Barcode 
                        value={labelProduct.barcode || labelProduct.legacy_code} 
                        width={labelConfig.size === '50x30mm' ? 0.9 : 1.1} 
                        height={labelConfig.size === '50x30mm' ? 22 : 32} 
                        fontSize={8} 
                        background="#ffffff" 
                        lineColor="#000000" 
                        margin={0} 
                      />
                    </div>
                  )}
                  {labelConfig.showPrice && (
                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mt-1">
                      {((labelProduct[labelConfig.priceKey] || 0) / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-4 max-w-xs text-center font-bold">
                  La etiqueta se adaptará al formato físico durante el envío a la impresora.
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="w-full flex gap-3 pt-6 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsLabelModalOpen(false)} 
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Imprimir {labelConfig.copies} Copias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTENEDOR IMPRIMIBLE (SOLO SE VE AL IMPRIMIR) */}
      {isPrintingLabels && labelProduct && (
        <div className="hidden print:block w-[80mm] bg-white print-container-parent overflow-visible">
          {Array.from({ length: labelConfig.copies }).map((_, i) => (
            <div 
              key={i} 
              className="print-copy-wrapper overflow-visible border-b border-dashed border-slate-400 py-3 flex flex-col items-center justify-center bg-white text-black font-mono text-center"
              style={{ 
                width: labelConfig.size === '50x30mm' ? '50mm' : '74mm',
                height: labelConfig.size === '50x30mm' ? '30mm' : 'auto',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                margin: '0 auto',
                boxSizing: 'border-box'
              }}
            >
              {labelConfig.showCompany && (
                <div className="text-[9px] font-black uppercase tracking-wider mb-0.5">
                  {profile?.trade_name || profile?.name || 'CIMENTA'}
                </div>
              )}
              {labelConfig.showName && (
                <div className="text-[10px] font-black uppercase leading-tight max-w-[95%] truncate">
                  {labelProduct.name}
                </div>
              )}
              {labelConfig.showSKU && (
                <div className="text-[8px] font-bold text-gray-500">
                  SKU: {labelProduct.legacy_code}
                </div>
              )}
              {labelConfig.showBarcode && (labelProduct.barcode || labelProduct.legacy_code) && (
                <div className="my-0.5 flex justify-center w-full overflow-hidden">
                  <Barcode 
                    value={labelProduct.barcode || labelProduct.legacy_code} 
                    width={labelConfig.size === '50x30mm' ? 0.8 : 1.1} 
                    height={labelConfig.size === '50x30mm' ? 22 : 32} 
                    fontSize={8} 
                    background="#ffffff" 
                    lineColor="#000000" 
                    margin={0} 
                  />
                </div>
              )}
              {labelConfig.showPrice && (
                <div className="text-xs font-black mt-0.5">
                  {((labelProduct[labelConfig.priceKey] || 0) / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Inventory
