import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Search, Phone, MapPin, CreditCard, ExternalLink, Loader2, Save, X, BookOpen, ShieldCheck } from 'lucide-react'
import axios from 'axios'

const CustomerModal = ({ isOpen, onClose, customer, onSave, catalogs }) => {
  const [form, setForm] = useState({
    name: '', phone: '', address: '', delivery_zone: '',
    customer_type: 'P1', credit_limit: 0, credit_days: 0, legacy_code: '',
    fiscal_rfc: '', fiscal_business: '', fiscal_regime: '', fiscal_cfdi: '', fiscal_email: '', fiscal_address: '', fiscal_zip: '',
    fiscal_street: '', fiscal_exterior: '', fiscal_interior: '', fiscal_colony: '', fiscal_municipality: '', fiscal_state: ''
  })
  const [activeTab, setActiveTab] = useState('General')
  const [saving, setSaving] = useState(false)
  const [zipLoading, setZipLoading] = useState(false)
  const [zipPlaces, setZipPlaces] = useState([])

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const getH = () => {
    const t = localStorage.getItem('token')
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {}
  }

  const handleZipChange = async (e) => {
     const val = e.target.value;
     setForm(p => ({ ...p, fiscal_zip: val }))
     if (val.length === 5) {
        setZipLoading(true)
        try {
           const res = await axios.get(`${apiUrl}/api/catalogs/cp/${val}`, getH())
           const places = res.data
           setZipPlaces(places || [])
           if (places && places.length > 0) {
             const place = places[0]
             setForm(p => ({ 
               ...p, 
               fiscal_state: place.state?.name || '', 
               fiscal_municipality: place.municipality || '', 
               fiscal_colony: place.settlement || ''
             }))
           }
        } catch(err) {
           console.log('Zip Fetch error', err)
        } finally {
           setZipLoading(false)
        }
     }
  }

  useEffect(() => {
    if (isOpen) {
      setActiveTab('General')
      if (customer) {
        const fc = customer.fiscal_client || {}
        setForm({
          name: customer.name || '',
          phone: customer.phone || '',
          address: customer.address || '',
          delivery_zone: customer.delivery_zone || '',
          customer_type: customer.customer_type || 'P1',
          credit_limit: (customer.credit_limit / 100) || 0,
          credit_days: customer.credit_days || 0,
          legacy_code: customer.legacy_code || '',
          fiscal_rfc: fc.rfc || '',
          fiscal_business: fc.business_name || '',
          fiscal_regime: fc.regime || '',
          fiscal_cfdi: fc.cfdi_use || '',
          fiscal_email: fc.email || '',
          fiscal_address: fc.address || '',
          fiscal_zip: fc.zip_code || '',
          fiscal_street: fc.street || '',
          fiscal_exterior: fc.exterior || '',
          fiscal_interior: fc.interior || '',
          fiscal_colony: fc.colony || '',
          fiscal_municipality: fc.municipality || '',
          fiscal_state: fc.state || ''
        })
      } else {
        setForm({
          name: '', phone: '', address: '', delivery_zone: '', customer_type: 'P1', credit_limit: 0, credit_days: 0, legacy_code: '',
          fiscal_rfc: '', fiscal_business: '', fiscal_regime: '', fiscal_cfdi: '', fiscal_email: '', fiscal_address: '',
          fiscal_zip: '', fiscal_street: '', fiscal_exterior: '', fiscal_interior: '', fiscal_colony: '', fiscal_municipality: '', fiscal_state: ''
        })
      }
    }
  }, [isOpen, customer])

  if (!isOpen) return null

  const submit = async () => {
    if (!form.name) return alert('El nombre es requerido.')
    setSaving(true)
    try {
      const payload = {
        name: form.name, phone: form.phone, address: form.address, delivery_zone: form.delivery_zone,
        customer_type: form.customer_type, credit_limit: form.credit_limit * 100, credit_days: form.credit_days, legacy_code: form.legacy_code,
        fiscal_data: form.fiscal_rfc ? {
          rfc: form.fiscal_rfc, business_name: form.fiscal_business, regime: form.fiscal_regime,
          cfdi_use: form.fiscal_cfdi, email: form.fiscal_email, address: form.fiscal_address,
          zip_code: form.fiscal_zip, street: form.fiscal_street, exterior: form.fiscal_exterior,
          interior: form.fiscal_interior, colony: form.fiscal_colony, municipality: form.fiscal_municipality, state: form.fiscal_state
        } : null
      }
      await onSave(payload, customer?.id)
      onClose()
    } catch (e) {
      alert(e.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-8 pb-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
            <p className="text-xs font-black text-primary-600 uppercase tracking-widest mt-1">
              Información Comercial y Fiscal
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-gray-100 shrink-0 gap-8">
          {['General', 'Crédito', 'Facturación'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 font-black text-sm transition-all border-b-2 ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
               {tab}
             </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
           
           {activeTab === 'General' && (
              <div className="space-y-4 max-w-xl">
                 <div className="flex items-center gap-2 mb-2"><BookOpen size={16} className="text-gray-400"/><h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Información Básica</h3></div>
                 <div><label className="label-xs">Nombre Comercial / Contacto</label><input className="input-std" value={form.name} onChange={set('name')}/></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="label-xs">Teléfono</label><input className="input-std" value={form.phone} onChange={set('phone')}/></div>
                   <div><label className="label-xs">Cód. Legacy</label><input className="input-std" value={form.legacy_code} onChange={set('legacy_code')}/></div>
                 </div>
                 <div><label className="label-xs">Dirección del Cliente (Matriz)</label><input className="input-std" value={form.address} onChange={set('address')}/></div>
                 <div><label className="label-xs">Dirección de Entregas / Flete</label><textarea className="input-std h-20 resize-none" value={form.delivery_zone} onChange={set('delivery_zone')}/></div>
              </div>
           )}

           {activeTab === 'Crédito' && (
              <div className="space-y-4 max-w-xl">
                 <div className="flex items-center gap-2 mb-2"><CreditCard size={16} className="text-gray-400"/><h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Línea de Crédito</h3></div>
                 <div><label className="label-xs">Límite Aprobado ($)</label><input type="number" className="input-std text-xl font-black text-orange-600" value={form.credit_limit} onChange={set('credit_limit')}/></div>
                 <div><label className="label-xs">Días de Crédito Plazo</label><input type="number" className="input-std" value={form.credit_days} onChange={set('credit_days')}/></div>
              </div>
           )}

           {activeTab === 'Facturación' && (
              <div className="space-y-4 max-w-xl">
                 <div className="flex items-center gap-2 mb-2"><ShieldCheck size={16} className="text-gray-400"/><h3 className="font-black text-gray-800 uppercase text-xs tracking-widest">Datos de Facturación (RFC)</h3></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="label-xs">RFC</label><input className="input-std" value={form.fiscal_rfc} onChange={set('fiscal_rfc')}/></div>
                   <div>
                     <label className="label-xs">Uso CFDI</label>
                     <select className="input-std appearance-none" value={form.fiscal_cfdi} onChange={set('fiscal_cfdi')}>
                        <option value="">Seleccione Uso CFDI</option>
                        {catalogs?.cfdiUses?.map(c => <option key={c.code} value={c.code}>[{c.code}] {c.description}</option>)}
                     </select>
                   </div>
                 </div>
                 <div><label className="label-xs">Razón Social</label><input className="input-std" value={form.fiscal_business} onChange={set('fiscal_business')}/></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="label-xs">Régimen Fiscal</label>
                     <select className="input-std appearance-none" value={form.fiscal_regime} onChange={set('fiscal_regime')}>
                        <option value="">Seleccione Régimen</option>
                        {catalogs?.regimes?.map(c => <option key={c.code} value={c.code}>[{c.code}] {c.description}</option>)}
                     </select>
                   </div>
                   <div>
                     <div className="flex justify-between items-center"><label className="label-xs">Código Postal</label>{zipLoading && <Loader2 size={10} className="animate-spin text-primary-500 mb-1"/>}</div>
                     <input className="input-std" placeholder="Ej. 44100" value={form.fiscal_zip} onChange={handleZipChange}/>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="label-xs">Colonia / Asentamiento</label>
                      {zipPlaces.length > 0 ? (
                        <select className="input-std appearance-none" value={form.fiscal_colony} onChange={set('fiscal_colony')}>
                           <option value="">Selecciona...</option>
                           {zipPlaces.map((p, i) => <option key={i} value={p.settlement}>{p.settlement}</option>)}
                        </select>
                      ) : (
                        <input className="input-std" value={form.fiscal_colony} onChange={set('fiscal_colony')}/>
                      )}
                   </div>
                   <div><label className="label-xs">Municipio / Localidad</label><input className="input-std" value={form.fiscal_municipality} onChange={set('fiscal_municipality')}/></div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2"><label className="label-xs">Calle</label><input className="input-std" value={form.fiscal_street} onChange={set('fiscal_street')}/></div>
                   <div><label className="label-xs">Estado</label><input className="input-std" value={form.fiscal_state} onChange={set('fiscal_state')}/></div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="label-xs">Núm. Exterior</label><input className="input-std" value={form.fiscal_exterior} onChange={set('fiscal_exterior')}/></div>
                   <div><label className="label-xs">Núm. Interior</label><input className="input-std" placeholder="Opcional" value={form.fiscal_interior} onChange={set('fiscal_interior')}/></div>
                 </div>

                 <div><label className="label-xs">Email Facturación</label><input className="input-std" value={form.fiscal_email} onChange={set('fiscal_email')}/></div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-gray-100 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-[2] py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-lg flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Guardar
          </button>
        </div>
      </div>
      <style>{`
        .label-xs { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
        .input-std { width: 100%; padding: 12px 16px; background: #f9fafb; border: 2px solid transparent; border-radius: 12px; font-weight: 700; color: #111827; outline: none; transition: all 0.2s; }
        .input-std:focus { border-color: #f7aab5; background: #fff; }
      `}</style>
    </div>
  )
}

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState({ open: false, item: null })
  const [catalogs, setCatalogs] = useState({ regimes: [], cfdiUses: [] })
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getH = () => {
    const t = localStorage.getItem('token')
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {}
  }

  useEffect(() => {
    axios.get(`${apiUrl}/api/catalogs`, getH()).then(res => setCatalogs(res.data)).catch(console.error)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers(searchQuery)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchCustomers = async (query = '') => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const url = query 
        ? `${apiUrl}/api/customers/search?query=${query}`
        : `${apiUrl}/api/customers`
      
      const res = await axios.get(url)
      setCustomers(res.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => setSearchQuery(e.target.value)

  const handleSaveCustomer = async (payload, id) => {
    if (id) {
       await axios.put(`${apiUrl}/api/customers/${id}`, payload, getH())
    } else {
       await axios.post(`${apiUrl}/api/customers`, payload, getH())
    }
    fetchCustomers(searchQuery)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, RFC, código o teléfono..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none" 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <button onClick={() => setModal({open:true, item:null})} className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all">
          <UserPlus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-primary-500">
          <Loader2 size={48} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {customers.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold">No se encontraron clientes</p>
            </div>
          ) : (
            customers.map(customer => (
              <div key={customer.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${customer.credit_limit > 0 ? 'bg-orange-500' : 'bg-primary-500'}`}></div>
                
                <div className="flex items-start justify-between relative mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <Users size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg text-gray-500">
                    {customer.customer_type || 'General'}
                  </span>
                </div>
                
                <h4 className="text-xl font-black text-gray-900 line-clamp-1">{customer.name}</h4>
                <p className="text-xs font-bold text-primary-500 mt-1">{customer.legacy_code}</p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone size={14} className="mr-2" />
                    <span>{customer.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin size={14} className="mr-2" />
                    <span className="line-clamp-1">{customer.address || 'Sin dirección'}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-end">
                   <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Límite de Crédito</span>
                      <p className={`font-black text-lg ${customer.credit_limit > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        ${(customer.credit_limit / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                   </div>
                   <button onClick={() => setModal({open:true, item:customer})} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <ExternalLink size={18} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <CustomerModal isOpen={modal.open} customer={modal.item} catalogs={catalogs} onClose={() => setModal({open:false, item:null})} onSave={handleSaveCustomer}/>
    </div>
  )
}

export default Customers
