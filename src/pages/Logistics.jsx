import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Truck, Package, MapPin, CheckCircle2, AlertCircle, Plus, X,
  Route, RotateCcw, Layers, User, Phone, KeyRound, BadgeCheck,
  Gauge, Weight, Box, Edit2, Trash2, Car, CarFront, BusFront,
  ArrowRight, CircleAlert, Wrench, Navigation, Map, Loader2, CircleDot,
  Banknote, CreditCard, ShieldCheck, HandCoins
} from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VEHICLE_TYPES = [
  { id: 'MOTOCICLETA', label: 'Motocicleta',   icon: '🏍️', max_kg: 30,   color: 'bg-yellow-100 text-yellow-800' },
  { id: 'CAMIONETA',   label: 'Camioneta',      icon: '🚐', max_kg: 1500, color: 'bg-blue-100 text-blue-800'   },
  { id: 'CAMION_3T',   label: 'Camión 3.5T',   icon: '🚛', max_kg: 3500, color: 'bg-orange-100 text-orange-800' },
  { id: 'CAMION_8T',   label: 'Camión 8T',     icon: '🚚', max_kg: 8000, color: 'bg-red-100 text-red-800'     },
  { id: 'TRAILER',     label: 'Tráiler',        icon: '🚜', max_kg: 25000,color: 'bg-purple-100 text-purple-800'},
]

const VehicleTypeBadge = ({ type }) => {
  const cfg = VEHICLE_TYPES.find(t => t.id === type) || { label: type, icon: '🚗', color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  )
}

const STATUS_DELIVERY = {
  PENDING:   { label: 'Pendiente', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  EN_RUTA:   { label: 'En Ruta',   color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500 animate-pulse' },
  ENTREGADO: { label: 'Entregado', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
}
const StatusBadge = ({ status }) => {
  const cfg = STATUS_DELIVERY[status] || STATUS_DELIVERY.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>{cfg.label}
    </span>
  )
}

const StatusVehicle = { 'Disponible':'bg-green-100 text-green-700', 'En Ruta':'bg-blue-100 text-blue-700', 'Mantenimiento':'bg-amber-100 text-amber-700', 'Inactivo':'bg-gray-100 text-gray-500' }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: Crear/Editar Vehículo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VehicleModal = ({ isOpen, onClose, vehicle, onSaved, apiUrl, getH }) => {
  const blank = { name:'', plate:'', type:'CAMIONETA', brand:'', model:'', year:'', capacity_weight:'', capacity_volume:'', notes:'' }
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(vehicle ? { ...vehicle, year: vehicle.year||'', capacity_weight: vehicle.capacity_weight||'', capacity_volume: vehicle.capacity_volume||'' } : blank) }, [vehicle])
  if (!isOpen) return null
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const submit = async () => {
    if (!form.name || !form.plate || !form.type) return alert('Nombre, placas y tipo son requeridos')
    setSaving(true)
    try {
      if (vehicle?.id) await axios.put(`${apiUrl}/api/fleet/vehicles/${vehicle.id}`, form, getH())
      else await axios.post(`${apiUrl}/api/fleet/vehicles`, form, getH())
      onSaved(); onClose()
    } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/50 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between p-10 pb-6 border-b border-gray-100">
          <div><h2 className="text-2xl font-black text-gray-900">{vehicle ? 'Editar' : 'Nuevo'} Vehículo</h2></div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200"><X size={18}/></button>
        </div>
        <div className="p-10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-xs">Nombre / Alias</label><input className="input-std" value={form.name} onChange={set('name')} placeholder="Camión 1, Foráneo..."/></div>
            <div><label className="label-xs">Placas *</label><input className="input-std" value={form.plate} onChange={set('plate')} placeholder="ABC-1234"/></div>
          </div>
          <div>
            <label className="label-xs">Tipo de Vehículo *</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {VEHICLE_TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(p=>({...p, type:t.id}))} className={`p-3 rounded-2xl border-2 text-center transition-all ${form.type===t.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <div className="text-[9px] font-black uppercase tracking-wide">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label-xs">Marca</label><input className="input-std" value={form.brand} onChange={set('brand')} placeholder="Ford..."/></div>
            <div><label className="label-xs">Modelo</label><input className="input-std" value={form.model} onChange={set('model')} placeholder="F-350..."/></div>
            <div><label className="label-xs">Año</label><input className="input-std" type="number" value={form.year} onChange={set('year')} placeholder="2022"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-xs">Capacidad Peso (KG)</label><input className="input-std" type="number" value={form.capacity_weight} onChange={set('capacity_weight')} placeholder="3500"/></div>
            <div><label className="label-xs">Capacidad Volumen (M³)</label><input className="input-std" type="number" value={form.capacity_volume} onChange={set('capacity_volume')} placeholder="14.5"/></div>
          </div>
          <div><label className="label-xs">Notas</label><textarea className="input-std resize-none h-16" value={form.notes} onChange={set('notes')} placeholder="Observaciones..."/></div>
        </div>
        <div className="px-10 pb-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-lg">
            {saving ? '...' : vehicle ? 'Guardar Cambios' : 'Registrar Vehículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: Crear/Editar Chofer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LICENSE_TYPES = ['A','B','C','D','E','DF','BUS']
const DriverModal = ({ isOpen, onClose, driver, vehicles, onSaved, apiUrl, getH }) => {
  const blank = { name:'', phone:'', license:'', license_type:'', vehicle_id:'', notes:'' }
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(driver ? { ...driver, vehicle_id: driver.vehicle_id||'' } : blank) }, [driver])
  if (!isOpen) return null
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const submit = async () => {
    if (!form.name) return alert('El nombre del chofer es requerido')
    setSaving(true)
    try {
      if (driver?.id) await axios.put(`${apiUrl}/api/fleet/drivers/${driver.id}`, form, getH())
      else await axios.post(`${apiUrl}/api/fleet/drivers`, form, getH())
      onSaved(); onClose()
    } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
    finally { setSaving(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-950/50 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between p-10 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-black text-gray-900">{driver ? 'Editar' : 'Nuevo'} Chofer</h2>
          <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200"><X size={18}/></button>
        </div>
        <div className="p-10 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-xs">Nombre Completo *</label><input className="input-std" value={form.name} onChange={set('name')} placeholder="Juan Pérez..."/></div>
            <div><label className="label-xs">Teléfono</label><input className="input-std" value={form.phone} onChange={set('phone')} placeholder="614-555-0000"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-xs">No. Licencia</label><input className="input-std" value={form.license} onChange={set('license')} placeholder="CHIHUAHUA-12345"/></div>
            <div>
              <label className="label-xs">Tipo de Licencia</label>
              <select className="input-std" value={form.license_type} onChange={set('license_type')}>
                <option value="">Sin especificar</option>
                {LICENSE_TYPES.map(l => <option key={l} value={l}>Tipo {l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-xs">Vehículo Habitual</label>
            <select className="input-std" value={form.vehicle_id} onChange={set('vehicle_id')}>
              <option value="">Sin asignación fija</option>
              {vehicles.filter(v => v.status !== 'Inactivo').map(v => (
                <option key={v.id} value={v.id}>{v.name} — {v.plate} ({v.type})</option>
              ))}
            </select>
          </div>
          <div><label className="label-xs">Notas</label><textarea className="input-std resize-none h-16" value={form.notes} onChange={set('notes')} placeholder="Observaciones..."/></div>
        </div>
        <div className="px-10 pb-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-lg">
            {saving ? '...' : driver ? 'Guardar Cambios' : 'Registrar Chofer'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Smart vehicle fit badge
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FIT_CONFIG = {
  OPTIMAL:    { label: '✅ Óptimo',       color: 'bg-green-100 text-green-800 border-green-200'  },
  ACCEPTABLE: { label: '👍 Aceptable',    color: 'bg-blue-100 text-blue-800 border-blue-200'    },
  OVERSIZED:  { label: '⚠️ Sobredim.',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  CANT_USE:   { label: '❌ Insuficiente', color: 'bg-red-100 text-red-700 border-red-200'       },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: Crear Ruta con Análisis Inteligente
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CreateRouteModal = ({ isOpen, onClose, pending, vehicles, drivers, onCreated, apiUrl, getH }) => {
  const [routeName, setRouteName] = useState('')
  const [selected, setSelected]   = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [analysis, setAnalysis]   = useState(null)  // Smart recommendation data
  const [analyzing, setAnalyzing] = useState(false)

  if (!isOpen) return null

  const toggle = async (id) => {
    const next = selected.includes(id)
      ? selected.filter(x => x !== id)
      : [...selected, id]
    setSelected(next)

    // Auto-analyze whenever selection changes (if any selected)
    if (next.length > 0) {
      setAnalyzing(true)
      try {
        const token = localStorage.getItem('token')
        const res = await axios.post(
          `${apiUrl}/api/logistics/analyze`,
          { delivery_ids: next },
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        )
        setAnalysis(res.data)
        // Auto-select the top ranked vehicle if it's OPTIMAL or ACCEPTABLE and user hasn't manually picked yet
        const top = res.data.rankedVehicles?.[0]
        if (top && top._status !== 'CANT_USE' && !vehicleId) {
          setVehicleId(top.id)
        }
      } catch(e) { console.error('Analysis error', e) }
      finally { setAnalyzing(false) }
    } else {
      setAnalysis(null)
      setVehicleId('')
    }
  }

  const handleCreate = async () => {
    if (!routeName.trim()) return alert('Asigna un nombre a la ruta')
    if (selected.length === 0) return alert('Selecciona al menos una entrega')
    setSaving(true)
    try {
      await axios.post(`${apiUrl}/api/logistics/routes`, {
        name: routeName.trim(), delivery_ids: selected,
        vehicle_id: vehicleId || null, driver_id: driverId || null
      }, getH())
      setRouteName(''); setSelected([]); setVehicleId(''); setDriverId(''); setAnalysis(null)
      onCreated(); onClose()
    } catch(e) { alert('Error al crear la ruta: ' + (e.response?.data?.error || e.message)) }
    finally { setSaving(false) }
  }

  // Use server-ranked vehicles if analysis available, otherwise use raw vehicles list
  const rankedVehicles = analysis?.rankedVehicles || vehicles.filter(v => v.status !== 'Inactivo').map(v => ({ ...v, _status: 'UNKNOWN' }))
  const selectedVehicle = rankedVehicles.find(v => v.id === vehicleId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] animate-in zoom-in-95">

        {/* Header */}
        <div className="flex items-center justify-between p-10 pb-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Nueva Ruta de Despacho</h2>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
              Sistema inteligente de asignación vehicular
            </p>
          </div>
          <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200"><X size={20}/></button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Deliveries selection */}
            <div className="space-y-5">
              <div>
                <label className="label-xs">Nombre de la Ruta</label>
                <input className="input-std text-base font-black mt-2" value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="Ej: Zona Norte Mañana..."/>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-xs">Entregas a Consolidar</label>
                  {selected.length > 0 && (
                    <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">
                      {selected.length} seleccionada(s)
                    </span>
                  )}
                </div>
                <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {pending.length === 0 ? (
                    <div className="text-center py-10"><Package size={40} className="mx-auto text-gray-200 mb-3"/><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sin entregas pendientes</p></div>
                  ) : pending.map(d => {
                    const isSelected = selected.includes(d.id)
                    const items = d.sale?.items || []
                    // Calculate weight for this specific delivery
                    const itemKg = items.reduce((s, it) => s + ((it.product?.weight || 0) * it.quantity), 0)
                    const hasWeight = itemKg > 0
                    return (
                      <button key={d.id} onClick={() => toggle(d.id)}
                        className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 transition-all text-left ${isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                          {isSelected && <CheckCircle2 size={14} className="text-white"/>}
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <p className="font-black text-gray-900 uppercase text-sm truncate">{d.sale?.customer?.name || 'Cliente'}</p>
                          <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">
                            <MapPin size={9} className="inline mr-1"/>{d.address}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[9px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-lg">{items.length} art.</span>
                            {hasWeight
                              ? <span className="text-[9px] font-black text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">~{itemKg.toFixed(1)} KG</span>
                              : <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">Sin datos de peso</span>
                            }
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-gray-400 shrink-0">{d.sale?.folio}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Smart analysis + vehicle selection */}
            <div className="space-y-5">

              {/* Analysis panel */}
              {selected.length > 0 && (
                <div className="rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm">
                  {/* Load metrics */}
                  <div className="bg-gray-950 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {analyzing ? '⚙️ Analizando carga...' : '🎯 Análisis de Carga'}
                      </p>
                      {analyzing && <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"/>}
                    </div>
                    {analysis ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{analysis.totalKg.toFixed(1)}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">KG Total</p>
                          </div>
                          <div className="bg-white/10 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-black text-white">{analysis.totalM3 > 0 ? analysis.totalM3.toFixed(2) : '—'}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">M³ Volumen</p>
                          </div>
                        </div>
                        {!analysis.hasData && (
                          <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-3">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">⚠️ Productos sin datos de peso — verificar manualmente</p>
                          </div>
                        )}
                        <div className="bg-primary-900/40 border border-primary-700/50 rounded-xl p-3">
                          <p className="text-[10px] font-black text-primary-300 uppercase tracking-widest mb-1">Tipo recomendado</p>
                          <p className="text-base font-black text-white">
                            {VEHICLE_TYPES.find(t => t.id === analysis.recommendedType)?.icon} {VEHICLE_TYPES.find(t => t.id === analysis.recommendedType)?.label}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-2xl p-4 text-center animate-pulse"><div className="h-6 bg-white/10 rounded mb-1"/><div className="h-3 bg-white/10 rounded"/></div>
                        <div className="bg-white/5 rounded-2xl p-4 text-center animate-pulse"><div className="h-6 bg-white/10 rounded mb-1"/><div className="h-3 bg-white/10 rounded"/></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle selector */}
              <div>
                <label className="label-xs">
                  {analysis ? '🚗 Vehículos — Ordenados por Mejor Ajuste' : 'Vehículo a Asignar'}
                </label>
                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto custom-scrollbar">
                  <button onClick={() => setVehicleId('')} className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${!vehicleId ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <p className="font-black text-sm text-gray-500 uppercase">Sin asignación por ahora</p>
                  </button>

                  {rankedVehicles.map((v, idx) => {
                    const fitCfg = FIT_CONFIG[v._status] || { label: '', color: 'bg-gray-100 text-gray-500 border-gray-200' }
                    const isChosen = vehicleId === v.id
                    const isCantUse = v._status === 'CANT_USE'
                    const isTop = idx === 0 && v._status !== 'CANT_USE' && analysis
                    return (
                      <button key={v.id}
                        onClick={() => !isCantUse && setVehicleId(v.id)}
                        disabled={isCantUse}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                          isCantUse ? 'opacity-50 cursor-not-allowed border-red-100 bg-red-50/30'
                          : isChosen ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl shrink-0">{VEHICLE_TYPES.find(t => t.id === v.type)?.icon || '🚗'}</span>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-gray-900 text-sm">{v.name}</p>
                              {isTop && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary-600 text-white uppercase">⭐ Recomendado</span>}
                              {v._status && v._status !== 'UNKNOWN' && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${fitCfg.color}`}>{fitCfg.label}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold">{v.plate} · {v.capacity_weight?.toLocaleString()}KG · {v.capacity_volume}M³</p>
                            {v._reason && (
                              <p className="text-[9px] font-bold text-gray-400 mt-0.5 italic">{v._reason}</p>
                            )}
                          </div>
                          {analysis && v._usageRatio !== undefined && (
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-black text-gray-900">{Math.round(v._usageRatio * 100)}%</p>
                              <p className="text-[9px] text-gray-400 font-bold">de uso</p>
                            </div>
                          )}
                        </div>
                        {/* Mini usage bar */}
                        {analysis && v._usageRatio !== undefined && !isCantUse && (
                          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${v._usageRatio >= 0.5 ? 'bg-green-500' : v._usageRatio >= 0.2 ? 'bg-blue-500' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(100, Math.round(v._usageRatio * 100))}%` }}
                            />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Driver selector */}
              <div>
                <label className="label-xs">Chofer a Asignar</label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto custom-scrollbar">
                  <button onClick={() => setDriverId('')} className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${!driverId ? 'border-gray-400 bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <p className="font-black text-sm text-gray-500 uppercase">Sin chofer asignado</p>
                  </button>
                  {drivers.filter(d => d.status === 'Activo').map(d => (
                    <button key={d.id} onClick={() => setDriverId(d.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${driverId === d.id ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-200 rounded-xl flex items-center justify-center shrink-0"><User size={16} className="text-gray-500"/></div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{d.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase">Lic. {d.license_type || 'General'} · {d.vehicle?.name || 'Sin unidad fija'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 pt-4 border-t border-gray-100 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-[2] py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            {saving
              ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"/>
              : <><Route size={22}/> Crear y Despachar</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB: Flota de Vehículos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FleetTab = ({ vehicles, loading, onAdd, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Flota Vehicular</h3>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{vehicles.length} unidades registradas</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg">
        <Plus size={18}/> Agregar Vehículo
      </button>
    </div>
    {loading ? <div className="text-center py-20 text-gray-400 font-black text-xs uppercase tracking-widest">Cargando...</div> :
    vehicles.length === 0 ? (
      <div className="text-center py-20 text-gray-300">
        <Truck size={72} className="mx-auto opacity-20 mb-4"/>
        <p className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Sin vehículos registrados</p>
        <button onClick={onAdd} className="text-primary-600 font-black text-sm hover:underline">+ Registrar primer vehículo</button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {vehicles.map(v => {
          const typeCfg = VEHICLE_TYPES.find(t => t.id === v.type) || { icon:'🚗', label: v.type }
          return (
            <div key={v.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all p-7 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">{typeCfg.icon}</div>
                  <div>
                    <p className="font-black text-gray-900 text-lg leading-none">{v.name}</p>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{v.plate}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${StatusVehicle[v.status]||'bg-gray-100 text-gray-500'}`}>{v.status}</span>
              </div>
              <VehicleTypeBadge type={v.type}/>
              { (v.brand||v.model||v.year) && <p className="text-xs text-gray-500 font-bold">{[v.brand,v.model,v.year].filter(Boolean).join(' · ')}</p> }
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xl font-black text-gray-900">{v.capacity_weight?.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">KG Máximo</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xl font-black text-gray-900">{v.capacity_volume}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">M³ Volumen</p>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => onEdit(v)} className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs flex items-center justify-center gap-2"><Edit2 size={14}/>Editar</button>
                <button onClick={() => onDelete(v.id)} className="py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs flex items-center gap-2"><Trash2 size={14}/></button>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </div>
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB: Choferes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DriversTab = ({ drivers, loading, onAdd, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Choferes</h3>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{drivers.length} choferes registrados</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg">
        <Plus size={18}/> Agregar Chofer
      </button>
    </div>
    {loading ? <div className="text-center py-20 text-gray-400 font-black text-xs uppercase tracking-widest">Cargando...</div> :
    drivers.length === 0 ? (
      <div className="text-center py-20 text-gray-300">
        <User size={72} className="mx-auto opacity-20 mb-4"/>
        <p className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Sin choferes registrados</p>
        <button onClick={onAdd} className="text-primary-600 font-black text-sm hover:underline">+ Registrar primer chofer</button>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {drivers.map(d => (
          <div key={d.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all p-7 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <User size={26} className="text-primary-500"/>
                </div>
                <div>
                  <p className="font-black text-gray-900 text-lg leading-none">{d.name}</p>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">{d.phone||'Sin teléfono'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${d.status==='Activo'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{d.status}</span>
            </div>
            <div className="space-y-2">
              {d.license && (
                <div className="flex items-center gap-2 text-xs">
                  <BadgeCheck size={14} className="text-primary-400 shrink-0"/>
                  <span className="font-bold text-gray-600">Licencia {d.license_type||''}: <span className="font-black text-gray-900">{d.license}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <Truck size={14} className="text-gray-400 shrink-0"/>
                <span className="font-bold text-gray-600">Unidad: <span className="font-black text-gray-900">{d.vehicle?.name||'Sin asignación fija'}</span></span>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => onEdit(d)} className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs flex items-center justify-center gap-2"><Edit2 size={14}/>Editar</button>
              <button onClick={() => onDelete(d.id)} className="py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 font-black text-xs flex items-center gap-2"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: Asignar entregas a ruta existente
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AssignToRouteModal = ({ isOpen, onClose, pending, routeName, onAssign }) => {
  const [selected, setSelected] = useState([])
  const [saving, setSaving]     = useState(false)

  // Reset selection when modal opens/closes
  useEffect(() => { if (isOpen) setSelected([]) }, [isOpen])

  if (!isOpen) return null

  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selectAll = () => setSelected(pending.map(d => d.id))

  const submit = async () => {
    if (selected.length === 0) return alert('Selecciona al menos una entrega')
    setSaving(true)
    try { await onAssign(selected) }
    catch(e) { /* handled in parent */ }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95">

        {/* Header */}
        <div className="p-10 pb-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Agregar Entregas</h2>
              <p className="text-xs font-black text-primary-600 uppercase tracking-widest mt-1">
                → Ruta: {routeName}
              </p>
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200"><X size={18}/></button>
          </div>
          {pending.length > 1 && (
            <button onClick={selectAll} className="mt-4 text-xs font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest">
              ✓ Seleccionar todas ({pending.length})
            </button>
          )}
        </div>

        {/* Pending deliveries list */}
        <div className="flex-grow overflow-y-auto p-8 space-y-3 custom-scrollbar">
          {pending.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="mx-auto text-green-300 mb-4"/>
              <p className="font-black text-sm text-gray-400 uppercase tracking-widest">No hay entregas pendientes por asignar</p>
            </div>
          ) : pending.map(d => {
            const isSelected = selected.includes(d.id)
            const items = d.sale?.items || []
            const itemKg = items.reduce((s, it) => s + ((it.product?.weight || 0) * it.quantity), 0)
            return (
              <button key={d.id} onClick={() => toggle(d.id)}
                className={`w-full p-5 rounded-2xl border-2 flex items-start gap-4 text-left transition-all ${
                  isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                  {isSelected && <CheckCircle2 size={14} className="text-white"/>}
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-black text-gray-900 uppercase text-sm truncate">{d.sale?.customer?.name || 'Cliente'}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">
                    <MapPin size={9} className="inline mr-1"/>{d.address || 'Sin dirección'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-lg">{items.length} art.</span>
                    {itemKg > 0
                      ? <span className="text-[9px] font-black text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">~{itemKg.toFixed(1)} KG</span>
                      : <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">Sin peso</span>
                    }
                    <span className="text-[9px] font-black text-gray-400">{d.sale?.folio}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-gray-100 flex gap-4 shrink-0">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={saving || selected.length === 0}
            className={`flex-[2] py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${
              selected.length > 0 ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving
              ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"/>
              : <><Plus size={20}/> Asignar {selected.length > 0 ? `(${selected.length})` : ''} a Ruta</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS = ['Despacho', 'Liquidación', 'Flota', 'Choferes']

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Modal: Reagendar Entrega Fallida
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RetryModal = ({ isOpen, onClose, delivery, onRetry }) => {
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && delivery) {
      setAddress(delivery.address || '')
      setNotes('')
    }
  }, [isOpen, delivery])

  if (!isOpen || !delivery) return null

  const submit = async () => {
    setSaving(true)
    try { await onRetry(delivery.id, address, notes) }
    catch(e) { /* handled */ }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg flex flex-col p-8 animate-in zoom-in-95">
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-1">Reagendar Entrega</h2>
        <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-6">
          Intento anterior fallido
        </p>

        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
          <p className="text-xs font-bold text-red-800">Razón: {delivery.fail_reason || 'Desconocida'}</p>
          {delivery.fail_notes && <p className="text-[10px] text-red-600 mt-1">Notas: {delivery.fail_notes}</p>}
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Verificar Dirección</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm"
              placeholder="Dirección correcta del cliente..."
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Instrucciones para nuevo intento</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm resize-none h-20"
              placeholder="Ej: Llamar al llegar, dejar en portería..."
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-[2] py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black shadow-lg flex justify-center items-center">
            {saving ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"/> : 'Lanzar de Nuevo'}
          </button>
        </div>
      </div>
    </div>
  )
}


const Logistics = () => {
  const [tab, setTab] = useState('Despacho')
  const [pending, setPending]   = useState([])
  const [routes, setRoutes]     = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [updatingId, setUpdatingId]       = useState(null)
  const [showCreateRoute, setShowCreateRoute] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [vehicleModal, setVehicleModal]       = useState({ open: false, item: null })
  const [driverModal, setDriverModal]         = useState({ open: false, item: null })
  const [retryModal, setRetryModal]           = useState({ open: false, item: null })
  const [pendingLiquidation, setPendingLiquidation] = useState([])
  const [liquidateModal, setLiquidateModal]   = useState({ open: false, sale: null })
  const [liquidateNotes, setLiquidateNotes]   = useState('')
  const [liquidating, setLiquidating]         = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const getH = () => {
    const t = localStorage.getItem('token')
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {}
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pR, rR, vR, dR, lR] = await Promise.all([
        axios.get(`${apiUrl}/api/logistics/deliveries/pending`, getH()),
        axios.get(`${apiUrl}/api/logistics/routes`, getH()),
        axios.get(`${apiUrl}/api/fleet/vehicles`, getH()),
        axios.get(`${apiUrl}/api/fleet/drivers`, getH()),
        axios.get(`${apiUrl}/api/logistics/pending-liquidation`, getH()).catch(() => ({ data: [] })),
      ])
      setPending(pR.data)
      setRoutes(rR.data)
      setVehicles(vR.data)
      setDrivers(dR.data)
      setPendingLiquidation(lR.data)
      if (rR.data.length > 0 && !selectedRoute) setSelectedRoute(rR.data[0])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadAll() }, [])

  const updateStatus = async (deliveryId, newStatus) => {
    setUpdatingId(deliveryId)
    try {
      await axios.patch(`${apiUrl}/api/logistics/delivery/${deliveryId}`, { status: newStatus }, getH())
      await loadAll()
    } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
    finally { setUpdatingId(null) }
  }

  const handleAssignToRoute = async (deliveryIds) => {
    if (!selectedRoute) return
    try {
      const res = await axios.post(`${apiUrl}/api/logistics/routes/${selectedRoute.id}/assign`, { delivery_ids: deliveryIds }, getH())
      setSelectedRoute(res.data)
      await loadAll()
      setShowAssignModal(false)
    } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleDeleteVehicle = async (id) => {
    if (!confirm('¿Desactivar este vehículo?')) return
    try { await axios.delete(`${apiUrl}/api/fleet/vehicles/${id}`, getH()); loadAll() }
    catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }
  const handleDeleteDriver = async (id) => {
    if (!confirm('¿Desactivar este chofer?')) return
    try { await axios.delete(`${apiUrl}/api/fleet/drivers/${id}`, getH()); loadAll() }
    catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const handleRetryDelivery = async (id, newAddress, notes) => {
    try {
      await axios.patch(`${apiUrl}/api/logistics/delivery/${id}/retry`, { address: newAddress, notes }, getH())
      setRetryModal({ open: false, item: null })
      await loadAll()
    } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
  }

  const totalPending   = pending.length
  const allDeliveries  = routes.flatMap(r => r.deliveries || [])
  const totalEnRuta    = allDeliveries.filter(d => d.status === 'EN_RUTA').length
  const totalEntregado = allDeliveries.filter(d => d.status === 'ENTREGADO').length
  const totalVehiculos = vehicles.filter(v => v.status !== 'Inactivo').length
  const totalLiquidar  = pendingLiquidation.length

  const handleLiquidate = async (saleId) => {
    setLiquidating(true)
    try {
      await axios.post(`${apiUrl}/api/logistics/liquidate/${saleId}`, { notes: liquidateNotes }, getH())
      setLiquidateModal({ open: false, sale: null })
      setLiquidateNotes('')
      await loadAll()
    } catch(e) {
      alert('Error: ' + (e.response?.data?.error || e.message))
    } finally {
      setLiquidating(false)
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label:'Sin Asignar',   value:totalPending,   icon:AlertCircle, color:'text-amber-600',  bg:'bg-amber-50'   },
          { label:'Rutas Activas', value:routes.length,  icon:Route,       color:'text-blue-600',   bg:'bg-blue-50'    },
          { label:'En Tránsito',   value:totalEnRuta,    icon:Truck,       color:'text-primary-600',bg:'bg-primary-50' },
          { label:'Por Liquidar',  value:totalLiquidar,  icon:HandCoins,   color:'text-orange-600', bg:'bg-orange-50'  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 flex items-center gap-5">
            <div className={`w-14 h-14 ${k.bg} rounded-2xl flex items-center justify-center shrink-0`}>
              <k.icon size={26} className={k.color}/>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{k.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/80 p-2 rounded-2xl border border-gray-100 shadow-sm shrink-0 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${tab===t ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-grow overflow-hidden">
        {tab === 'Flota' ? (
          <div className="h-full overflow-y-auto custom-scrollbar pr-1">
            <FleetTab vehicles={vehicles} loading={loading} onAdd={() => setVehicleModal({open:true,item:null})} onEdit={v=>setVehicleModal({open:true,item:v})} onDelete={handleDeleteVehicle}/>
          </div>
        ) : tab === 'Choferes' ? (
          <div className="h-full overflow-y-auto custom-scrollbar pr-1">
            <DriversTab drivers={drivers} loading={loading} onAdd={() => setDriverModal({open:true,item:null})} onEdit={d=>setDriverModal({open:true,item:d})} onDelete={handleDeleteDriver}/>
          </div>
        ) : tab === 'Liquidación' ? (
          /* ─── TAB LIQUIDACIÓN ─── */
          <div className="h-full overflow-y-auto custom-scrollbar pr-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Liquidación de Cobranza</h3>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                  {pendingLiquidation.length} cobro(s) pendiente(s) de verificar
                </p>
              </div>
              <button onClick={loadAll} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all">
                <RotateCcw size={18}/>
              </button>
            </div>

            {pendingLiquidation.length === 0 ? (
              <div className="text-center py-20 text-gray-300">
                <ShieldCheck size={72} className="mx-auto opacity-20 mb-4"/>
                <p className="font-black text-sm uppercase tracking-widest text-gray-400">Todo liquidado</p>
                <p className="text-xs text-gray-400 mt-2">No hay cobros pendientes de verificación</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLiquidation.map(sale => {
                  const totalDisplay = (sale.total_amount || 0) / 100
                  const isEfectivo = (sale.collected_method || sale.payment_method || '').toUpperCase().includes('EFECT') || (sale.collected_method || sale.payment_method || '').toUpperCase().includes('CONTRA')
                  return (
                    <div key={sale.id} className="bg-white rounded-[2rem] border border-orange-100 shadow-sm p-6 hover:shadow-lg hover:border-orange-200 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                            isEfectivo ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {isEfectivo ? <Banknote size={28}/> : <CreditCard size={28}/>}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-black text-gray-900 text-lg">{sale.customer?.name || 'Cliente'}</p>
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-orange-100 text-orange-700 border border-orange-200">
                                Cobrado — Pendiente
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-bold mt-1">Folio: {sale.folio}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                                <User size={10} className="inline mr-1"/>{sale.driver_name}
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${
                                isEfectivo ? 'text-green-700 bg-green-50 border-green-100' : 'text-blue-700 bg-blue-50 border-blue-100'
                              }`}>
                                {isEfectivo ? '💵 Efectivo' : '💳 Tarjeta'}
                              </span>
                              {sale.collected_at && (
                                <span className="text-[10px] font-bold text-gray-400">
                                  Cobrado: {new Date(sale.collected_at).toLocaleString('es-MX', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-orange-600">${totalDisplay.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          <button onClick={() => { setLiquidateModal({ open: true, sale }); setLiquidateNotes('') }}
                            className="mt-3 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                          >
                            <ShieldCheck size={16}/> Liquidar
                          </button>
                        </div>
                      </div>

                      {/* Products preview */}
                      {sale.items && sale.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-3 flex-wrap">
                          {sale.items.slice(0, 4).map(it => (
                            <span key={it.id} className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                              {it.product?.name?.substring(0, 25)} ×{it.quantity}
                            </span>
                          ))}
                          {sale.items.length > 4 && (
                            <span className="text-[10px] font-black text-primary-500">+{sale.items.length - 4} más</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          // ─── DESPACHO ───────────────────────────────────────
          <div className="h-full grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 overflow-hidden">

            {/* Left column */}
            <div className="flex flex-col gap-4 overflow-hidden">

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-amber-100/50 flex flex-col overflow-hidden max-h-[300px]">
                <div className="flex items-center justify-between px-8 pt-7 pb-4 shrink-0">
                  <div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tighter">Sin Asignar</h3>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">{totalPending} entrega(s)</p>
                  </div>
                  <button onClick={() => setShowCreateRoute(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-2xl font-black text-xs shadow-lg">
                    <Plus size={16}/> Crear Ruta
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
                  {pending.length === 0 ? (
                    <div className="text-center py-6"><CheckCircle2 size={36} className="mx-auto text-green-300 mb-2"/><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Todas asignadas</p></div>
                  ) : pending.map(d => {
                    const isFailed = d.status === 'NO_ENTREGADO'
                    return (
                    <div key={d.id} className={`p-4 border rounded-2xl flex flex-col gap-3 ${isFailed ? 'bg-red-50/50 border-red-100' : 'bg-amber-50/50 border-amber-100'}`}>
                      <div className="flex items-center gap-4">
                        {isFailed ? <AlertCircle size={18} className="text-red-600 shrink-0"/> : <Package size={18} className="text-amber-600 shrink-0"/>}
                        <div className="flex-grow overflow-hidden">
                          <p className={`font-black text-sm uppercase truncate ${isFailed ? 'text-red-900' : 'text-gray-900'}`}>{d.sale?.customer?.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase truncate"><MapPin size={9} className="inline mr-1"/>{d.address||'Sin dirección'}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 ${isFailed ? 'text-red-700 bg-red-100' : 'text-amber-600 bg-amber-100'}`}>
                            {isFailed ? 'FALLIDA' : d.sale?.type}
                          </span>
                        </div>
                      </div>
                      
                      {/* Retry Action */}
                      {isFailed && (
                        <div className="mt-1 pt-3 border-t border-red-100 space-y-2">
                          <div className="text-[10px] text-red-600 font-bold">Razón: {d.fail_reason}</div>
                          {d.fail_notes && (
                            <div className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
                              📝 {d.fail_notes}
                            </div>
                          )}
                          {d.attempt_count > 1 && (
                            <div className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                              ⚠ Intento #{d.attempt_count}
                            </div>
                          )}
                          {d.proof_notes && d.attempt_count > 1 && (
                            <div className="text-[10px] text-gray-500 font-bold bg-gray-50 px-2 py-1.5 rounded-lg space-y-1 max-h-[60px] overflow-y-auto custom-scrollbar">
                              {d.proof_notes.split('\n').filter(l => l.trim()).map((line, i) => (
                                <p key={i} className="leading-tight">{line}</p>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-end">
                            <button onClick={() => setRetryModal({open:true, item:d})} className="shrink-0 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-colors">
                              <RotateCcw size={12}/> Reagendar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </div>

              {/* Routes list */}
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col overflow-hidden flex-grow">
                <div className="px-8 pt-7 pb-4 border-b border-gray-50 shrink-0">
                  <h3 className="font-black text-gray-900 text-xl tracking-tighter">Rutas Activas</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{routes.length} rutas creadas</p>
                </div>
                <div className="flex-grow overflow-y-auto p-5 space-y-3 custom-scrollbar">
                  {routes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-10 text-gray-300">
                      <Route size={48} className="opacity-20 mb-3"/>
                      <p className="font-black text-xs uppercase tracking-widest text-gray-400">Sin rutas</p>
                    </div>
                  ) : routes.map(r => {
                    const dels = r.deliveries || []
                    const done = dels.filter(d=>d.status==='ENTREGADO').length
                    const pct  = dels.length > 0 ? Math.round((done/dels.length)*100) : 0
                    const isActive = selectedRoute?.id === r.id
                    return (
                      <button key={r.id} onClick={() => setSelectedRoute(r)} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${isActive ? 'bg-primary-50 border-primary-400' : 'bg-gray-50 border-transparent hover:border-gray-200 hover:bg-white'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className={`font-black uppercase text-sm ${isActive?'text-primary-800':'text-gray-900'}`}>{r.name}</p>
                            {r.tracking_active && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-200 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                                <span className="text-[8px] font-black text-green-700 uppercase">En Vivo</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-gray-400">{dels.length} paradas</span>
                        </div>
                        {(r.vehicle || r.driver) && (
                          <div className="flex items-center gap-3 mb-3 text-[10px] font-black text-gray-500">
                            {r.vehicle && <span>{VEHICLE_TYPES.find(t=>t.id===r.vehicle.type)?.icon||'🚗'} {r.vehicle.name}</span>}
                            {r.driver && <span><User size={10} className="inline mr-0.5"/>{r.driver.name}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex-grow bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-primary-600 h-full rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
                          </div>
                          <span className="text-[10px] font-black text-gray-500">{done}/{dels.length}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Route detail */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col overflow-hidden">
              {!selectedRoute ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <Layers size={64} className="opacity-20 mb-4"/>
                  <p className="font-black text-sm uppercase tracking-widest text-gray-400">Selecciona una ruta</p>
                </div>
              ) : (() => {
                const dels = selectedRoute.deliveries || []
                const done = dels.filter(d=>d.status==='ENTREGADO').length
                const pct  = dels.length > 0 ? Math.round((done/dels.length)*100) : 0
                return (
                  <>
                    <div className="p-8 pb-5 border-b border-gray-50 shrink-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Ruta Activa</p>
                          <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{selectedRoute.name}</h2>
                          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-600">
                            {selectedRoute.vehicle && (
                              <span className="flex items-center gap-2 font-bold">
                                <span className="text-lg">{VEHICLE_TYPES.find(t=>t.id===selectedRoute.vehicle.type)?.icon||'🚗'}</span>
                                {selectedRoute.vehicle.name} · {selectedRoute.vehicle.plate}
                                <span className="text-[10px] font-black text-gray-400">({selectedRoute.vehicle.capacity_weight}KG)</span>
                              </span>
                            )}
                            {selectedRoute.driver && (
                              <span className="flex items-center gap-1.5 font-bold"><User size={14} className="text-gray-400"/>{selectedRoute.driver.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {/* Live tracking button */}
                          {selectedRoute.tracking_active && (
                            <button onClick={async () => {
                              try {
                                const res = await axios.get(`${apiUrl}/api/logistics/routes/${selectedRoute.id}/tracking`, getH())
                                const t = res.data
                                if (t.current_lat && t.current_lng) {
                                  const embedUrl = `https://maps.google.com/maps?q=${t.current_lat},${t.current_lng}&z=15&output=embed`
                                  window.__liveTrackingInterval && clearInterval(window.__liveTrackingInterval)
                                  // Open a live tracking window
                                  const w = window.open('', '_blank', 'width=800,height=600')
                                  if (w) {
                                    w.document.title = `📍 ${t.driver?.name || 'Chofer'} — En Vivo`
                                    w.document.body.style.margin = '0'
                                    w.document.body.innerHTML = `
                                      <div style="font-family:system-ui;background:#111;color:#fff;height:100vh;display:flex;flex-direction:column">
                                        <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;background:#1a1a1a">
                                          <div>
                                            <div style="font-size:16px;font-weight:900">📍 ${t.driver?.name || 'Chofer'} — Tracking En Vivo</div>
                                            <div style="font-size:11px;color:#888;margin-top:4px">${t.vehicle?.name || ''} · Se actualiza cada 10s</div>
                                          </div>
                                          <div id="coords" style="font-size:11px;color:#4ade80;font-weight:700"></div>
                                        </div>
                                        <iframe id="mapFrame" src="${embedUrl}" style="flex:1;border:0" allowfullscreen></iframe>
                                      </div>
                                    `
                                    // Auto-refresh map every 10 seconds
                                    const trackingUrl = `${apiUrl}/api/logistics/routes/${selectedRoute.id}/tracking`
                                    const refreshMap = async () => {
                                      try {
                                        const token = localStorage.getItem('token')
                                        const r2 = await fetch(trackingUrl, { headers: { 'Authorization': 'Bearer ' + token } })
                                        const d2 = await r2.json()
                                        if (d2.current_lat && d2.current_lng) {
                                          const frame = w.document.getElementById('mapFrame')
                                          const coordsEl = w.document.getElementById('coords')
                                          if (frame) frame.src = 'https://maps.google.com/maps?q=' + d2.current_lat + ',' + d2.current_lng + '&z=15&output=embed'
                                          if (coordsEl) coordsEl.textContent = d2.current_lat.toFixed(5) + ', ' + d2.current_lng.toFixed(5) + ' · ' + new Date().toLocaleTimeString()
                                        }
                                      } catch(e) {}
                                    }
                                    const interval = setInterval(refreshMap, 10000)
                                    w.addEventListener('beforeunload', () => clearInterval(interval))
                                  }
                                } else {
                                  alert('El chofer aún no ha iniciado el recorrido')
                                }
                              } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
                            }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95 animate-pulse" title="Ver ubicación en vivo del chofer">
                              <CircleDot size={14}/> En Vivo
                            </button>
                          )}
                          {/* Map button */}
                          <button onClick={async () => {
                            try {
                              const res = await axios.get(`${apiUrl}/api/logistics/routes/${selectedRoute.id}/maps-url`, getH())
                              if (res.data.mapsUrl) window.open(res.data.mapsUrl, '_blank')
                              else alert('Sin direcciones válidas para mostrar en el mapa')
                            } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
                          }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95" title="Ver ruta en Google Maps">
                            <Navigation size={14}/> Mapa
                          </button>
                          {/* Optimize button */}
                          <button onClick={async () => {
                            if (!confirm('¿Optimizar el orden de entregas por proximidad? (puede tomar unos segundos)')) return
                            try {
                              const res = await axios.post(`${apiUrl}/api/logistics/routes/${selectedRoute.id}/optimize`, { originAddress: 'Materiales Monar, Chihuahua, Mexico' }, getH())
                              if (res.data.mapsUrl) {
                                alert(`✅ Ruta optimizada: ${res.data.totalDistanceKm} KM estimados (${res.data.geocodedCount}/${res.data.totalDeliveries} direcciones geocodificadas)`)
                                window.open(res.data.mapsUrl, '_blank')
                              } else {
                                alert(res.data.error || 'No se pudo optimizar')
                              }
                            } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
                          }} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95" title="Optimizar orden por proximidad">
                            <Map size={14}/> Optimizar
                          </button>
                          {pending.length > 0 && (
                            <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95">
                              <Plus size={14}/> Agregar
                            </button>
                          )}
                          <button onClick={loadAll} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl"><RotateCcw size={16}/></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex-grow bg-gray-100 h-3 rounded-full overflow-hidden">
                          <div className="bg-primary-600 h-full rounded-full transition-all duration-700" style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-sm font-black text-gray-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {dels.map((d, idx) => {
                        const customer = d.sale?.customer
                        const items = d.sale?.items || []
                        const isUpdating = updatingId === d.id
                        return (
                          <div key={d.id} className="p-6 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-black shrink-0">{idx+1}</div>
                                <div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <p className="font-black text-gray-900 uppercase">{customer?.name||'—'}</p>
                                    <StatusBadge status={d.status}/>
                                  </div>
                                  <p className="text-xs text-gray-500 font-bold mt-1"><MapPin size={11} className="inline mr-1 text-gray-400"/>{d.address||'Sin dirección'}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{items.length} producto(s) · {d.sale?.folio}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {d.status === 'EN_RUTA' && (
                                  <button disabled={isUpdating} onClick={() => updateStatus(d.id,'ENTREGADO')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow disabled:opacity-50">
                                    {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <CheckCircle2 size={15}/>} Entregado
                                  </button>
                                )}
                                {d.status === 'PENDING' && (
                                  <button disabled={isUpdating} onClick={() => updateStatus(d.id,'EN_RUTA')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow disabled:opacity-50">
                                    {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Truck size={15}/>} Despachar
                                  </button>
                                )}
                                {d.status === 'ENTREGADO' && <div className="flex items-center gap-1 text-green-600 text-xs font-black px-3 py-2.5"><CheckCircle2 size={15}/> Completo</div>}
                              </div>
                            </div>
                            {items.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                                {items.slice(0,3).map(it => (
                                  <div key={it.id} className="flex justify-between text-xs text-gray-500">
                                    <span className="font-bold uppercase truncate max-w-[70%]">{it.product?.name}</span>
                                    <span className="font-black text-gray-700">x{it.quantity}</span>
                                  </div>
                                ))}
                                {items.length > 3 && <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest mt-1">+{items.length-3} artículo(s) más</p>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRouteModal isOpen={showCreateRoute} onClose={() => setShowCreateRoute(false)} pending={pending} vehicles={vehicles} drivers={drivers} onCreated={loadAll} apiUrl={apiUrl} getH={getH}/>
      <VehicleModal isOpen={vehicleModal.open} vehicle={vehicleModal.item} onClose={() => setVehicleModal({open:false,item:null})} onSaved={loadAll} apiUrl={apiUrl} getH={getH}/>
      <DriverModal  isOpen={driverModal.open}  driver={driverModal.item}  onClose={() => setDriverModal({open:false,item:null})}  onSaved={loadAll} vehicles={vehicles} apiUrl={apiUrl} getH={getH}/>
      <RetryModal   isOpen={retryModal.open}   delivery={retryModal.item} onClose={() => setRetryModal({open:false,item:null})} onRetry={handleRetryDelivery} />

      {/* Assign deliveries to existing route */}
      <AssignToRouteModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        pending={pending}
        routeName={selectedRoute?.name || ''}
        onAssign={handleAssignToRoute}
      />

      {/* Liquidation Confirmation Modal */}
      {liquidateModal.open && liquidateModal.sale && (() => {
        const sale = liquidateModal.sale
        const totalDisplay = (sale.total_amount || 0) / 100
        const isEfectivo = (sale.collected_method || sale.payment_method || '').toUpperCase().includes('EFECT') || (sale.collected_method || sale.payment_method || '').toUpperCase().includes('CONTRA')
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95">
              <div className="p-10 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center">
                    <ShieldCheck size={32} className="text-green-600"/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Confirmar Liquidación</h2>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">
                      Verificar recepción de {isEfectivo ? 'efectivo' : 'voucher de tarjeta'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-6">
                {/* Sale summary */}
                <div className="bg-gray-50 rounded-[2rem] p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Folio</span>
                    <span className="font-black text-gray-900">{sale.folio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Cliente</span>
                    <span className="font-black text-gray-900">{sale.customer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Chofer</span>
                    <span className="font-black text-gray-900">{sale.driver_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Método</span>
                    <span className={`font-black text-sm px-3 py-1 rounded-full ${isEfectivo ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isEfectivo ? '💵 Efectivo' : '💳 Tarjeta'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total a Liquidar</span>
                    <span className="text-3xl font-black text-green-600">${totalDisplay.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Notes input */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                    Notas de Verificación (opcional)
                  </label>
                  <input
                    type="text"
                    value={liquidateNotes}
                    onChange={e => setLiquidateNotes(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-green-400 rounded-2xl outline-none font-bold text-gray-900 transition-all"
                    placeholder={isEfectivo ? 'Ej: Efectivo contado y verificado' : 'Ej: Voucher #1234 recibido'}
                  />
                </div>
              </div>

              <div className="px-10 pb-10 flex gap-4">
                <button onClick={() => setLiquidateModal({ open: false, sale: null })}
                  className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button onClick={() => handleLiquidate(sale.id)} disabled={liquidating}
                  className="flex-[2] py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                >
                  {liquidating
                    ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"/>
                    : <><ShieldCheck size={22}/> Confirmar Liquidación</>
                  }
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Inline styles for shorthand classes */}
      <style>{`
        .label-xs { @apply text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5; }
        .input-std { @apply w-full px-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-primary-400 rounded-2xl outline-none font-bold text-gray-900 text-base transition-all; }
      `}</style>
    </div>
  )
}

export default Logistics
