import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Truck, Package, MapPin, CheckCircle2, AlertTriangle, User,
  ChevronRight, Phone, Navigation, RotateCcw, Clock, Box,
  ArrowLeft, CircleDot, CircleCheckBig, Route as RouteIcon,
  X, ExternalLink, Loader2, Map, LogOut, WifiOff
} from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { apiUrl, getHeaders as getH } from '../api/apiConfig'

const VEHICLE_ICONS = {
  MOTOCICLETA: '🏍️', CAMIONETA: '🚐', CAMION_3T: '🚛', CAMION_8T: '🚚', TRAILER: '🚜'
}

const STATUS_CFG = {
  PENDING:       { label: 'Pendiente',     color: 'bg-amber-500',  textColor: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  EN_RUTA:       { label: 'En Ruta',       color: 'bg-blue-500',   textColor: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  ENTREGADO:     { label: 'Entregado',     color: 'bg-green-500',  textColor: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  NO_ENTREGADO:  { label: 'No Entregado',  color: 'bg-red-500',    textColor: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
}

const FAIL_REASONS = [
  { id: 'NO_ENCONTRADO', label: 'Cliente no encontrado', icon: '👤' },
  { id: 'DIRECCION_INCORRECTA', label: 'Dirección incorrecta', icon: '📍' },
  { id: 'RECHAZADO', label: 'Cliente rechazó entrega', icon: '❌' },
  { id: 'CERRADO', label: 'Negocio/domicilio cerrado', icon: '🔒' },
  { id: 'OTRO', label: 'Otro motivo', icon: '📝' },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Screen: Driver Selection (login)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DriverSelectScreen = ({ onSelect }) => {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/logistics/drivers/active`, getH())
        setDrivers(res.data)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Hero header */}
      <div className="pt-16 pb-10 px-8 text-center relative">
        <button 
          onClick={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.hash = '#/login'
            window.location.reload()
          }}
          className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-2xl border border-white/5 transition-all flex items-center gap-2 group"
        >
           <LogOut size={18} className="text-gray-400 group-hover:text-white"/>
           <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest">Salir del Sistema</span>
        </button>
        <div className="w-24 h-24 bg-primary-600 rounded-[2rem] mx-auto flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30">
          <Truck size={44} className="text-white"/>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter">Entregas</h1>
        <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">Materiales Monar</p>
      </div>

      {/* Driver list */}
      <div className="flex-grow bg-white rounded-t-[3rem] px-6 pt-10 pb-6">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Selecciona tu perfil de chofer</p>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User size={56} className="mx-auto opacity-30 mb-4"/>
            <p className="font-black text-sm uppercase tracking-widest">Sin choferes registrados</p>
            <p className="text-xs mt-2">Pide al administrador que registre choferes en el módulo de Logística</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-md mx-auto">
            {drivers.map(d => (
              <button key={d.id} onClick={() => onSelect(d)}
                className="w-full p-5 bg-gray-50 hover:bg-primary-50 border-2 border-transparent hover:border-primary-400 rounded-[1.5rem] flex items-center gap-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0">
                  <User size={26} className="text-primary-600"/>
                </div>
                <div className="flex-grow">
                  <p className="font-black text-gray-900 text-lg">{d.name}</p>
                  <p className="text-xs text-gray-500 font-bold mt-0.5">
                    {d.vehicle ? `${VEHICLE_ICONS[d.vehicle.type]||'🚗'} ${d.vehicle.name}` : 'Sin vehículo asignado'}
                  </p>
                </div>
                <ChevronRight size={22} className="text-gray-300"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Screen: Route Overview  
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RouteOverviewScreen = ({ driver, onBack, onSelectRoute }) => {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  const loadRoutes = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiUrl}/api/logistics/driver/${driver.id}/routes`, getH())
      setRoutes(res.data)
      localStorage.setItem(`driverPWA_cache_${driver.id}`, JSON.stringify(res.data))
    } catch(e) { 
      if (!navigator.onLine || e.code === 'ERR_NETWORK') {
         const cached = localStorage.getItem(`driverPWA_cache_${driver.id}`)
         if (cached) {
            setRoutes(JSON.parse(cached))
            console.log('[Offline] Loaded routes from cache')
         }
      } else {
         console.error(e) 
      }
    }
    finally { setLoading(false) }
  }
  useEffect(() => { loadRoutes() }, [driver.id])

  const activeRoutes = routes.filter(r => {
    const dels = r.deliveries || []
    return dels.some(d => d.status !== 'ENTREGADO')
  })
  const completedRoutes = routes.filter(r => {
    const dels = r.deliveries || []
    return dels.length > 0 && dels.every(d => d.status === 'ENTREGADO')
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-950 px-6 pt-14 pb-8 rounded-b-[2.5rem] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 flex items-center gap-2">
            <ArrowLeft size={20} className="text-white"/>
            <span className="text-[10px] font-black text-white/50 uppercase">Choferes</span>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.hash = '#/login'
                window.location.reload()
              }}
              className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 border border-white/10 flex items-center gap-2 transition-all"
            >
              <LogOut size={18} className="text-white"/>
              <span className="text-[10px] font-black text-white uppercase hidden md:inline">Cerrar Sesión</span>
            </button>
            <button onClick={loadRoutes} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <RotateCcw size={18} className="text-white"/>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
            <User size={28} className="text-white"/>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chofer</p>
            <h1 className="text-2xl font-black text-white tracking-tighter">{driver.name}</h1>
            {driver.vehicle && (
              <p className="text-xs font-bold text-gray-400 mt-0.5">{VEHICLE_ICONS[driver.vehicle.type]||'🚗'} {driver.vehicle.name} · {driver.vehicle.plate}</p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { n: activeRoutes.length,    label: 'Activas',    c: 'text-blue-400' },
            { n: completedRoutes.length, label: 'Completas',  c: 'text-green-400' },
            { n: routes.reduce((s,r) => s + (r.deliveries||[]).length, 0), label: 'Paradas', c: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center">
              <p className={`text-2xl font-black ${s.c}`}>{s.n}</p>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Routes list */}
      <div className="flex-grow px-6 pt-6 pb-8 space-y-4">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <RouteIcon size={56} className="mx-auto opacity-20 mb-4"/>
            <p className="font-black text-sm uppercase tracking-widest">Sin rutas asignadas</p>
            <p className="text-xs mt-2">Espera a que logística te asigne una ruta</p>
            <button onClick={loadRoutes} className="mt-6 px-6 py-3 bg-primary-600 text-white rounded-2xl font-black text-sm">
              <RotateCcw size={16} className="inline mr-2"/>Actualizar
            </button>
          </div>
        ) : (
          <>
            {activeRoutes.length > 0 && (
              <>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rutas Activas</p>
                {activeRoutes.map(r => {
                  const dels = r.deliveries || []
                  const done = dels.filter(d => d.status === 'ENTREGADO').length
                  const pct = dels.length > 0 ? Math.round((done/dels.length)*100) : 0
                  return (
                    <button key={r.id} onClick={() => onSelectRoute(r)}
                      className="w-full bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm text-left hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-black text-gray-900 text-lg">{r.name}</p>
                        <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase">{dels.length} paradas</span>
                      </div>
                      {r.vehicle && (
                        <p className="text-xs text-gray-500 font-bold mb-3">
                          {VEHICLE_ICONS[r.vehicle.type]||'🚗'} {r.vehicle.name} · {r.vehicle.plate}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex-grow bg-gray-100 h-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-green-500' : 'bg-primary-600'}`} style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-sm font-black text-gray-600">{pct}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mt-2">{done} de {dels.length} entregadas</p>
                    </button>
                  )
                })}
              </>
            )}

            {completedRoutes.length > 0 && (
              <>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Completadas</p>
                {completedRoutes.map(r => (
                  <button key={r.id} onClick={() => onSelectRoute(r)}
                    className="w-full bg-green-50 rounded-[2rem] p-5 border border-green-100 text-left opacity-80"
                  >
                    <div className="flex items-center gap-3">
                      <CircleCheckBig size={22} className="text-green-500 shrink-0"/>
                      <div>
                        <p className="font-black text-green-800">{r.name}</p>
                        <p className="text-[10px] text-green-600 font-bold">{(r.deliveries||[]).length} entregas completadas</p>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Screen: Route Detail (delivery by delivery)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RouteDetailScreen = ({ route: initialRoute, onBack }) => {
  const [route, setRoute] = useState(initialRoute)
  const [updatingId, setUpdatingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [mapData, setMapData] = useState(null)
  const [mapLoading, setMapLoading] = useState(false)

  // Delivery action modals
  const [failModal, setFailModal] = useState(null)      // delivery id being marked as failed
  const [failReason, setFailReason] = useState('')
  const [failNotes, setFailNotes] = useState('')
  const [deliverModal, setDeliverModal] = useState(null) // delivery id being marked as delivered
  const [proofNotes, setProofNotes] = useState('')
  const [extraCharges, setExtraCharges] = useState('')
  const [extraChargesNote, setExtraChargesNote] = useState('')
  
  // Payment Collection
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [receivedAmount, setReceivedAmount] = useState('')
  
  // Offline State Indicators
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [pendingSyncs, setPendingSyncs] = useState(0)

  // Internet listener + Sync Queue Processor
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncOfflineQueue = async () => {
      const queue = JSON.parse(localStorage.getItem('driverPWA_syncQueue')) || [];
      if (queue.length > 0) setPendingSyncs(queue.length);
      else setPendingSyncs(0);

      if (navigator.onLine && queue.length > 0) {
         console.log('[Offline Sync] Processing', queue.length, 'tasks');
         const remaining = [];
         let changed = false;
         for (const task of queue) {
           try {
              await axios.patch(`${apiUrl}/api/logistics/delivery/${task.id}`, { status: task.status, ...task.extraData }, getH());
              changed = true;
           } catch(e) {
              remaining.push(task);
           }
         }
         localStorage.setItem('driverPWA_syncQueue', JSON.stringify(remaining));
         setPendingSyncs(remaining.length);
         if (changed) reloadRoute(); // refresh real data
      }
    };

    // Attempt sync every 15 seconds
    const interval = setInterval(syncOfflineQueue, 15000);
    syncOfflineQueue(); // run once on load

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    }
  }, []);


  // Live tracking state
  const [isTracking, setIsTracking] = useState(false)
  const [currentPos, setCurrentPos] = useState(null)
  const watchIdRef = useRef(null)
  const sendIntervalRef = useRef(null)

  const reloadRoute = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/logistics/routes`, getH())
      const found = res.data.find(r => r.id === route.id)
      if (found) setRoute(found)
    } catch(e) { console.error(e) }
  }

  const updateStatus = async (deliveryId, newStatus, extraData = {}) => {
    setUpdatingId(deliveryId)
    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE_MODE');
      }
      await axios.patch(`${apiUrl}/api/logistics/delivery/${deliveryId}`, { status: newStatus, ...extraData }, getH())
      await reloadRoute()
      setFailModal(null)
      setDeliverModal(null)
    } catch(e) { 
       if (e.message === 'OFFLINE_MODE' || e.code === 'ERR_NETWORK') {
           console.log('[Offline] Saving task to queue');
           const queue = JSON.parse(localStorage.getItem('driverPWA_syncQueue')) || [];
           queue.push({ id: deliveryId, status: newStatus, extraData });
           localStorage.setItem('driverPWA_syncQueue', JSON.stringify(queue));
           
           if (typeof setPendingSyncs === 'function') setPendingSyncs(queue.length);
           
           // Optimistic update in UI
           setRoute(prev => {
             if(!prev) return prev;
             return {
               ...prev,
               deliveries: prev.deliveries.map(d => d.id === deliveryId ? { ...d, status: newStatus } : d)
             }
           });
           setFailModal(null);
           setDeliverModal(null);
       } else {
           alert(`Error de Conexión a ${apiUrl}: ` + (e.response?.data?.error || e.message)) 
       }
    }
    finally { setUpdatingId(null) }
  }

  // ── Live GPS Tracking ──
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización')
      return
    }

    setIsTracking(true)

    // Notify server tracking is active
    axios.patch(`${apiUrl}/api/logistics/routes/${route.id}/tracking-toggle`, { active: true }, getH()).catch(() => {})

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude }
        setCurrentPos(pos)
      },
      (err) => { console.error('GPS Error:', err) },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    // Send position to server every 10 seconds
    sendIntervalRef.current = setInterval(async () => {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            reject, { enableHighAccuracy: true, timeout: 10000 }
          )
        })
        await axios.patch(`${apiUrl}/api/logistics/routes/${route.id}/location`, pos, getH())
      } catch(e) { /* silent - will retry */ }
    }, 10000)
  }

  const stopTracking = () => {
    setIsTracking(false)
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current)
      sendIntervalRef.current = null
    }
    // Notify server tracking is off
    axios.patch(`${apiUrl}/api/logistics/routes/${route.id}/tracking-toggle`, { active: false }, getH()).catch(() => {})
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current)
    }
  }, [])

  const dels = route.deliveries || []
  const done = dels.filter(d => d.status === 'ENTREGADO').length
  const pct  = dels.length > 0 ? Math.round((done/dels.length)*100) : 0
  const isComplete = pct === 100

  // Sort: EN_RUTA first, then PENDING, then ENTREGADO
  const sortOrder = { EN_RUTA: 0, PENDING: 1, ENTREGADO: 2 }
  const sorted = [...dels].sort((a,b) => (sortOrder[a.status]||9) - (sortOrder[b.status]||9))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`px-6 pt-14 pb-6 rounded-b-[2.5rem] shadow-xl transition-colors duration-500 ${isComplete ? 'bg-green-600' : 'bg-gray-950'}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { stopTracking(); onBack() }} className="p-2 bg-white/10 rounded-xl hover:bg-white/20">
            <ArrowLeft size={20} className="text-white"/>
          </button>
          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                 <WifiOff size={12} className="text-red-400"/>
                 <span className="text-[10px] font-black text-red-400 uppercase">Sin Red</span>
              </span>
            )}
            {pendingSyncs > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
                 <RotateCcw size={12} className="text-amber-400 animate-spin-slow"/>
                 <span className="text-[10px] font-black text-amber-400 uppercase">{pendingSyncs} Pdtes</span>
              </span>
            )}
            {isTracking && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                <span className="text-[10px] font-black text-green-400 uppercase">GPS</span>
              </span>
            )}
            <button 
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.hash = '#/login'
                window.location.reload()
              }}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 border border-white/10 flex items-center gap-2"
            >
              <LogOut size={16} className="text-white"/>
            </button>
            <button onClick={reloadRoute} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition">
              <RotateCcw size={18} className="text-white"/>
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tighter">{route.name}</h1>
        {route.vehicle && (
          <p className="text-xs font-bold text-white/60 mt-1">
            {VEHICLE_ICONS[route.vehicle.type]||'🚗'} {route.vehicle.name} · {route.vehicle.plate}
          </p>
        )}

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white/70 uppercase tracking-widest">Progreso</span>
            <span className="text-lg font-black text-white">{pct}%</span>
          </div>
          <div className="bg-white/20 h-4 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-white' : 'bg-primary-400'}`} style={{width:`${pct}%`}}/>
          </div>
          <p className="text-xs font-bold text-white/50 mt-2">{done} de {dels.length} entregas completadas</p>
        </div>
      </div>

      {/* Map navigation buttons */}
      {!isComplete && (
        <div className="px-5 pt-5 flex gap-3">
          <button onClick={async () => {
            setMapLoading(true)
            try {
              const res = await axios.get(`${apiUrl}/api/logistics/routes/${route.id}/maps-url`, getH())
              if (res.data.mapsUrl && res.data.addresses?.length > 0) {
                // Build embeddable URL using maps.google.com
                const origin = 'Materiales Monar, Chihuahua, Mexico'
                const addrs = res.data.addresses
                const dest = addrs[addrs.length - 1]
                const waypoints = addrs.slice(0, -1).join('+to:')
                const embedUrl = waypoints
                  ? `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(waypoints)}+to:${encodeURIComponent(dest)}&output=embed`
                  : `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(dest)}&output=embed`
                setMapData({
                  embedUrl,
                  externalUrl: res.data.mapsUrl,
                  totalStops: res.data.totalStops,
                  addresses: res.data.addresses
                })
                setShowMap(true)
              } else {
                alert('Sin direcciones válidas para mostrar en el mapa')
              }
            } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
            finally { setMapLoading(false) }
          }} disabled={mapLoading}
            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] disabled:opacity-60"
          >
            {mapLoading
              ? <><Loader2 size={20} className="animate-spin"/> Cargando...</>
              : <><Navigation size={20}/> Navegar Ruta</>
            }
          </button>
          <button onClick={async () => {
            try {
              const res = await axios.post(`${apiUrl}/api/logistics/routes/${route.id}/optimize`, { originAddress: 'Materiales Monar, Chihuahua, Mexico' }, getH())
              if (res.data.mapsUrl) {
                // Build embed from optimized addresses
                const coords = res.data.coordinates || []
                const origin = 'Materiales Monar, Chihuahua, Mexico'
                const optimizedAddrs = coords.map(c => c.address).filter(a => a)
                if (optimizedAddrs.length > 0) {
                  const dest = optimizedAddrs[optimizedAddrs.length - 1]
                  const wps = optimizedAddrs.slice(0, -1).join('+to:')
                  const embedUrl = wps
                    ? `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(wps)}+to:${encodeURIComponent(dest)}&output=embed`
                    : `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(dest)}&output=embed`
                  setMapData({
                    embedUrl,
                    externalUrl: res.data.mapsUrl,
                    totalStops: optimizedAddrs.length,
                    addresses: optimizedAddrs,
                    optimized: true,
                    distanceKm: res.data.totalDistanceKm
                  })
                  setShowMap(true)
                } else {
                  window.open(res.data.mapsUrl, '_blank')
                }
              } else { alert(res.data.error || 'No se pudo optimizar') }
            } catch(e) { alert('Error: ' + (e.response?.data?.error || e.message)) }
          }} className="py-4 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97]">
            <Map size={20}/> Óptima
          </button>
        </div>
      )}

      {/* Embedded Map Overlay */}
      {showMap && mapData && (
        <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Map header */}
          <div className="bg-gray-900 px-5 py-4 flex items-center justify-between shrink-0 safe-area-top">
            <div>
              <p className="text-white font-black text-base">
                {mapData.optimized ? '🎯 Ruta Optimizada' : '🗺️ Ruta de Entregas'}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  {mapData.totalStops} parada(s)
                  {mapData.distanceKm ? ` · ~${mapData.distanceKm} KM` : ''}
                </p>
                {isTracking && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/>
                    <span className="text-[8px] font-black text-green-400 uppercase">GPS</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(mapData.externalUrl, '_blank')}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl"
                title="Abrir en Google Maps"
              >
                <ExternalLink size={18} className="text-white"/>
              </button>
              <button onClick={() => setShowMap(false)}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl"
              >
                <X size={18} className="text-red-400"/>
              </button>
            </div>
          </div>

          {/* Map iframe */}
          <div className="flex-grow relative">
            <iframe
              src={mapData.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de Ruta"
              onLoad={(e) => {
                // Hide the loading overlay when iframe loads
                const overlay = e.target.parentElement.querySelector('.map-loading-overlay')
                if (overlay) overlay.style.opacity = '0'
                setTimeout(() => { if (overlay) overlay.style.display = 'none' }, 500)
              }}
            />
            {/* Loading overlay */}
            <div className="map-loading-overlay absolute inset-0 flex items-center justify-center bg-gray-950 pointer-events-none transition-opacity duration-500">
              <div className="text-center">
                <Loader2 size={36} className="mx-auto text-primary-400 animate-spin mb-3"/>
                <p className="text-white font-black text-sm">Cargando mapa...</p>
              </div>
            </div>
          </div>

          {/* Bottom bar with stops + tracking */}
          <div className="bg-gray-900 px-5 py-4 shrink-0 safe-area-bottom">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              <div className="shrink-0 px-3 py-2 bg-primary-600 rounded-xl">
                <p className="text-[9px] font-black text-primary-200 uppercase">Origen</p>
                <p className="text-xs font-black text-white truncate max-w-[120px]">Mat. Monar</p>
              </div>
              {(mapData.addresses || []).map((addr, i) => (
                <div key={i} className="shrink-0 px-3 py-2 bg-white/10 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Parada {i+1}</p>
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{addr}</p>
                </div>
              ))}
            </div>

            {/* Tracking + Google Maps buttons */}
            <div className="flex gap-3 mt-3">
              <button onClick={isTracking ? stopTracking : startTracking}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] transition-all ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                }`}
              >
                {isTracking ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75"/>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400"/>
                    </span>
                    Detener
                    {currentPos && (
                      <span className="text-[9px] font-bold opacity-60">
                        {currentPos.lat.toFixed(3)},{currentPos.lng.toFixed(3)}
                      </span>
                    )}
                  </>
                ) : (
                  <><Navigation size={16}/> Iniciar Recorrido</>
                )}
              </button>
              <button onClick={() => window.open(mapData.externalUrl, '_blank')}
                className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97]"
              >
                <ExternalLink size={16}/> Google Maps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries list */}
      <div className="flex-grow px-5 pt-4 pb-24 space-y-4">
        {isComplete && (
          <div className="bg-green-50 border border-green-200 rounded-[2rem] p-6 text-center mb-4 animate-in zoom-in-95">
            <CircleCheckBig size={48} className="mx-auto text-green-500 mb-3"/>
            <p className="font-black text-green-800 text-xl">¡Ruta Completada!</p>
            <p className="text-sm text-green-600 font-bold mt-1">Todas las entregas fueron realizadas exitosamente</p>
          </div>
        )}

        {sorted.map((d, idx) => {
          const cfg = STATUS_CFG[d.status] || STATUS_CFG.PENDING
          const customer = d.sale?.customer
          const items = d.sale?.items || []
          const isUpdating = updatingId === d.id
          const isExpanded = expandedId === d.id

          return (
            <div key={d.id} className={`bg-white rounded-[2rem] border ${cfg.border} shadow-sm overflow-hidden transition-all`}>
              {/* Card header - clickable to expand */}
              <button onClick={() => setExpandedId(isExpanded ? null : d.id)} className="w-full p-5 text-left">
                <div className="flex items-start gap-4">
                  {/* Step number */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                    d.status === 'ENTREGADO' ? 'bg-green-500 text-white' : d.status === 'EN_RUTA' ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {d.status === 'ENTREGADO' ? <CheckCircle2 size={20}/> : idx + 1}
                  </div>

                  <div className="flex-grow overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-gray-900 uppercase leading-tight">{customer?.name || 'Cliente'}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${cfg.bg} ${cfg.textColor}`}>{cfg.label}</span>
                      {d.attempt_count > 1 && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase bg-amber-100 text-amber-700 border border-amber-300 animate-pulse">
                          ⚠ Intento #{d.attempt_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400 shrink-0"/>{d.address || 'Sin dirección'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{items.length} producto(s) · Folio {d.sale?.folio}</p>
                  </div>

                  <ChevronRight size={18} className={`text-gray-300 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                  {/* Customer info */}
                  {customer?.phone && (
                    <a href={`tel:${customer.phone}`} className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl mt-4 hover:bg-blue-100">
                      <Phone size={18} className="text-blue-600"/>
                      <span className="font-black text-blue-800 text-sm">{customer.phone}</span>
                      <span className="text-xs text-blue-500 font-bold ml-auto">Llamar</span>
                    </a>
                  )}

                  {/* Navigate button */}
                  {d.address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(d.address)}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl mt-3 hover:bg-green-100"
                    >
                      <Navigation size={18} className="text-green-600"/>
                      <span className="font-black text-green-800 text-sm">Abrir en Google Maps</span>
                    </a>
                  )}

                  {/* Products */}
                  <div className="mt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Productos a Entregar</p>
                    <div className="space-y-2">
                      {items.map(it => (
                        <div key={it.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Box size={16} className="text-gray-400 shrink-0"/>
                            <div>
                              <p className="font-bold text-gray-800 text-sm truncate max-w-[200px]">{it.product?.name}</p>
                              {it.product?.weight > 0 && (
                                <p className="text-[10px] text-gray-400 font-bold">{(it.product.weight * it.quantity).toFixed(1)} KG</p>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-gray-900 text-lg">×{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Retry history — show prominently to driver */}
                  {d.attempt_count > 1 && (
                    <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚠️</span>
                        <p className="text-xs font-black text-amber-800 uppercase tracking-widest">
                          Reintento — Intento #{d.attempt_count}
                        </p>
                      </div>
                      {d.proof_notes && (
                        <div className="space-y-1.5 mt-2">
                          {d.proof_notes.split('\n').filter(l => l.trim()).map((line, i) => {
                            const isFailLine = line.includes('[Intento')
                            const isNoteLine = line.includes('[Nota de reagendado]')
                            return (
                              <div key={i} className={`flex items-start gap-2 text-xs rounded-xl px-3 py-2 ${
                                isFailLine ? 'bg-red-50 border border-red-100' :
                                isNoteLine ? 'bg-blue-50 border border-blue-100' :
                                'bg-white border border-gray-100'
                              }`}>
                                <span className="shrink-0 mt-0.5">
                                  {isFailLine ? '❌' : isNoteLine ? '📝' : '📋'}
                                </span>
                                <p className={`font-bold leading-snug ${
                                  isFailLine ? 'text-red-700' :
                                  isNoteLine ? 'text-blue-700' :
                                  'text-gray-700'
                                }`}>
                                  {line.replace(/^\[.*?\]\s*/, '')}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {d.sale?.status === 'PENDIENTE_COBRO' && d.status !== 'ENTREGADO' && (
                    <div className="mt-4 p-4 bg-orange-100 border-2 border-orange-400 rounded-2xl shadow-xl shadow-orange-100 animate-pulse">
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-3xl">🫴</span>
                         <div>
                            <p className="text-xs font-black text-orange-800 uppercase tracking-widest">Cobrar al cliente (Contra Entrega)</p>
                            <p className="text-3xl font-black text-orange-700 leading-none">${((d.sale?.total_amount || 0) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-5 space-y-3">
                    {d.status !== 'ENTREGADO' && d.status !== 'NO_ENTREGADO' && (
                      <div className="flex gap-3">
                        <button disabled={isUpdating} onClick={() => {
                          setDeliverModal(d.id)
                          setProofNotes(''); setExtraCharges(''); setExtraChargesNote('')
                          setPaymentMethod('Efectivo'); setReceivedAmount('')
                        }}
                          className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] disabled:opacity-50"
                        >
                          <CheckCircle2 size={20}/> Entregado
                        </button>
                        <button disabled={isUpdating} onClick={() => {
                          setFailModal(d.id)
                          setFailReason(''); setFailNotes('')
                        }}
                          className="py-4 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50"
                        >
                          <AlertTriangle size={18}/> No Entregado
                        </button>
                      </div>
                    )}
                    {d.status === 'PENDING' && (
                      <button disabled={isUpdating} onClick={() => updateStatus(d.id, 'EN_RUTA')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] disabled:opacity-50"
                      >
                        <Truck size={18}/> Marcar En Camino
                      </button>
                    )}
                    {d.status === 'ENTREGADO' && (
                      <div className="py-4 bg-green-50 rounded-2xl flex flex-col items-center gap-1 text-green-600">
                        <div className="flex items-center gap-2 font-black text-sm"><CircleCheckBig size={20}/> Entregado ✓</div>
                        {d.delivered_at && <p className="text-[10px] text-green-500">{new Date(d.delivered_at).toLocaleString()}</p>}
                        {d.proof_notes && <p className="text-[10px] text-green-600">Recibió: {d.proof_notes}</p>}
                        {d.extra_charges > 0 && <p className="text-[10px] font-black text-amber-600">+${d.extra_charges.toFixed(2)} cargo extra</p>}
                        {d.sale?.status === 'COBRADO_CHOFER' && (
                          <p className="text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full mt-1 uppercase tracking-widest">
                            💰 Cobrado — Pendiente de Liquidación en Oficina
                          </p>
                        )}
                        {d.sale?.status === 'LIQUIDADO' && (
                          <p className="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full mt-1 uppercase tracking-widest">
                            ✅ Liquidado
                          </p>
                        )}
                      </div>
                    )}
                    {d.status === 'NO_ENTREGADO' && (
                      <div className="py-4 px-4 bg-red-50 border border-red-200 rounded-2xl">
                        <div className="flex items-center gap-2 text-red-600 font-black text-sm mb-1"><AlertTriangle size={16}/> No Entregado</div>
                        {d.fail_reason && <p className="text-xs text-red-500">{FAIL_REASONS.find(r=>r.id===d.fail_reason)?.label || d.fail_reason}</p>}
                        {d.fail_notes && <p className="text-xs text-red-400 mt-0.5">{d.fail_notes}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">Se reagendará desde logística</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── Fail Delivery Modal ─── */}
      {failModal && (
        <div className="fixed inset-0 z-[200] bg-gray-950/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
          <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg p-8 animate-in slide-in-from-bottom-8 duration-300">
            <h3 className="text-xl font-black text-gray-900 mb-1">¿Por qué no se entregó?</h3>
            <p className="text-xs text-gray-500 font-bold mb-5">Selecciona el motivo para reportar al equipo de logística</p>

            <div className="space-y-2 mb-5">
              {FAIL_REASONS.map(r => (
                <button key={r.id} onClick={() => setFailReason(r.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
                    failReason === r.id ? 'border-red-400 bg-red-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl">{r.icon}</span>
                  <span className="font-bold text-gray-800">{r.label}</span>
                </button>
              ))}
            </div>

            <textarea value={failNotes} onChange={e => setFailNotes(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold resize-none h-20 mb-5"
              placeholder="Notas adicionales (opcional)..."
            />

            <div className="flex gap-3">
              <button onClick={() => setFailModal(null)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600">Cancelar</button>
              <button disabled={!failReason || updatingId} onClick={() => updateStatus(failModal, 'NO_ENTREGADO', { fail_reason: failReason, fail_notes: failNotes })}
                className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-2 ${
                  failReason ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {updatingId ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"/> : <>Reportar No Entregado</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Deliver Confirmation Modal ─── */}
      {deliverModal && (() => {
        const activeDelivery = mapData?.deliveries?.find(x => x.id === deliverModal) || 
                               route.deliveries?.find(x => x.id === deliverModal);
        const isPendingCobro = activeDelivery?.sale?.status === 'PENDIENTE_COBRO';
        const totalAmount = ((activeDelivery?.sale?.total_amount || 0) / 100);
        
        return (
          <div className="fixed inset-0 z-[200] bg-gray-950/70 backdrop-blur-sm flex items-end justify-center animate-in fade-in">
            <div className="bg-white rounded-t-[2.5rem] w-full max-w-lg p-8 animate-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-black text-gray-900 mb-1">Confirmar Entrega</h3>
              <p className="text-xs text-gray-500 font-bold mb-5">Marca quién recibió y si hay cargos adicionales</p>

              {isPendingCobro && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-[1.5rem] p-4">
                   <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">💰 Cobrar Contra Entrega: ${(totalAmount).toFixed(2)}</p>
                   
                   <div className="flex gap-2 mb-4">
                      <button onClick={() => setPaymentMethod('Efectivo')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${paymentMethod === 'Efectivo' ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-white border border-orange-200 text-orange-600'}`}>
                        Efectivo
                      </button>
                      <button onClick={() => setPaymentMethod('Tarjeta')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${paymentMethod === 'Tarjeta' ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-white border border-orange-200 text-orange-600'}`}>
                        Tarjeta
                      </button>
                   </div>
                   
                   {paymentMethod === 'Efectivo' && (
                     <div className="space-y-3">
                       <input type="number" placeholder={`Monto Recibido (ej. ${Math.ceil(totalAmount)})`} value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} className="w-full p-4 bg-white border border-orange-200 focus:border-orange-500 outline-none rounded-xl text-lg font-black" />
                       {receivedAmount && parseFloat(receivedAmount) >= totalAmount && (
                          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100">
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cambio</span>
                             <span className="text-xl font-black text-orange-700">${(parseFloat(receivedAmount) - totalAmount).toFixed(2)}</span>
                          </div>
                       )}
                     </div>
                   )}
                </div>
              )}

              <input value={proofNotes} onChange={e => setProofNotes(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold mb-4"
                placeholder="¿Quién recibió? (nombre, opcional)"
              />

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">💲 Cargos Adicionales (opcional)</p>
                <div className="flex gap-3">
                  <input type="number" step="0.01" min="0" value={extraCharges} onChange={e => setExtraCharges(e.target.value)}
                    className="w-28 p-3 bg-white border border-amber-200 rounded-xl text-sm font-bold"
                    placeholder="$0.00"
                  />
                  <input value={extraChargesNote} onChange={e => setExtraChargesNote(e.target.value)}
                    className="flex-1 p-3 bg-white border border-amber-200 rounded-xl text-sm font-bold"
                    placeholder="Motivo del cargo..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setDeliverModal(null)} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 font-black text-gray-600">Cancelar</button>
                <button disabled={updatingId || (isPendingCobro && paymentMethod === 'Efectivo' && receivedAmount && parseFloat(receivedAmount) < totalAmount)} onClick={() => updateStatus(deliverModal, 'ENTREGADO', {
                  proof_notes: proofNotes,
                  extra_charges: extraCharges ? parseFloat(extraCharges) : 0,
                  extra_charges_note: extraChargesNote,
                  payment_method: isPendingCobro ? paymentMethod : undefined,
                  received_amount: isPendingCobro && receivedAmount ? parseFloat(receivedAmount) : 0
                })}
                  className="flex-[2] py-4 rounded-2xl font-black text-white bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingId ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"/> : <><CheckCircle2 size={20}/> Confirmar Entrega</>}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main PWA Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function DriverPWA() {
  const [screen, setScreen]     = useState('select')  // select | routes | detail
  const [driver, setDriver]     = useState(null)
  const [activeRoute, setActiveRoute] = useState(null)

  // Persist driver selection
  useEffect(() => {
    // 1. Check if the logged-in system user already has a linked driver profile
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.role === 'Chofer' && user.driver) {
          console.log('[Auto-Login] Linked driver found:', user.driver.name)
          setDriver(user.driver)
          setScreen('routes')
          return // Stop here, no need to check driverPWA_driverId
        }
      } catch (e) { console.error('Error parsing user for auto-driver selection:', e) }
    }

    // 2. Fallback to manual selection cache
    const saved = localStorage.getItem('driverPWA_driverId')
    if (saved) {
      const restore = async () => {
        try {
          const res = await axios.get(`${apiUrl}/api/logistics/drivers/active`, getH())
          const found = res.data.find(d => d.id === saved)
          if (found) {
            setDriver(found)
            setScreen('routes')
          }
        } catch(e) { /* no problem */ }
      }
      restore()
    }
  }, [])

  const handleSelectDriver = (d) => {
    setDriver(d)
    localStorage.setItem('driverPWA_driverId', d.id)
    setScreen('routes')
  }

  const handleLogout = () => {
    setDriver(null)
    setActiveRoute(null)
    localStorage.removeItem('driverPWA_driverId')
    setScreen('select')
  }

  const handleSelectRoute = (r) => {
    setActiveRoute(r)
    setScreen('detail')
  }

  if (screen === 'select' || !driver) {
    return <DriverSelectScreen onSelect={handleSelectDriver}/>
  }

  if (screen === 'detail' && activeRoute) {
    return <RouteDetailScreen route={activeRoute} onBack={() => { setActiveRoute(null); setScreen('routes') }}/>
  }

  return <RouteOverviewScreen driver={driver} onBack={handleLogout} onSelectRoute={handleSelectRoute}/>
}
