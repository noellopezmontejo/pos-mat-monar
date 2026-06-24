import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, Package, AlertCircle, ShoppingBag, Clock, BarChart3, Loader2 } from 'lucide-react'
import axios from 'axios'

const StatCard = ({ icon: Icon, label, value, trend, color, bgColor, subtitle, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex-grow">
      <span className="text-gray-500 text-sm font-medium">{label}</span>
      <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-gray-400 text-xs mt-1 font-bold">{subtitle}</p>}
      
      {trend !== undefined && (
        <div className={`flex items-center mt-3 text-xs ${trend > 0 ? 'text-green-500' : (trend < 0 ? 'text-red-500' : 'text-gray-400')}`}>
          {trend !== 0 ? (
            <TrendingUp size={14} className={`mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
          ) : (
            <span className="w-3 h-0.5 bg-gray-400 mr-1 block shrink-0"></span>
          )}
          <span className="font-bold">{Math.abs(trend)}%</span>
          <span className="text-gray-400 ml-1 font-normal">vs ayer</span>
        </div>
      )}
    </div>
    <div className={`p-4 rounded-2xl ${bgColor} shrink-0 ml-4`}>
      <Icon size={24} className={color} />
    </div>
  </div>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const getH = () => {
    const t = localStorage.getItem('token')
    return t ? { headers: { Authorization: `Bearer ${t}` } } : {}
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${apiUrl}/api/reports/dashboard-stats`, getH())
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(err.response?.data?.error || 'No se pudo conectar con el servidor local.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-40 space-y-4">
        <Loader2 size={48} className="animate-spin text-primary-600" />
        <p className="text-gray-400 font-black text-xs tracking-widest uppercase animate-pulse">Cargando estadísticas reales...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50/50 border border-red-100 p-8 rounded-3xl text-center max-w-md mx-auto my-20 backdrop-blur-sm">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Error de Conexión</h3>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-6 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-lg shadow-primary-100 transition-all text-sm uppercase tracking-wider"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const {
    salesToday,
    salesTodayTrend,
    newCustomersToday,
    newCustomersTrend,
    totalCustomers,
    lowStockCount,
    pendingAdvances,
    pendingCollections,
    criticalStockItems,
    weeklySales
  } = stats

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={ShoppingBag} 
          label="Ventas del Día" 
          value={`$${(salesToday || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} 
          trend={salesTodayTrend} 
          color="text-primary-600" 
          bgColor="bg-primary-50"
        />
        <StatCard 
          icon={Users} 
          label="Clientes Nuevos" 
          value={newCustomersToday} 
          trend={newCustomersTrend} 
          subtitle={`Total: ${totalCustomers || 0}`}
          color="text-orange-600" 
          bgColor="bg-orange-50"
          onClick={() => navigate('/clientes')}
        />
        <StatCard 
          icon={Package} 
          label="Stock Bajo" 
          value={lowStockCount || 0} 
          trend={0} 
          color="text-red-600" 
          bgColor="bg-red-50"
          onClick={() => navigate('/inventario')}
        />
        <StatCard 
          icon={Clock} 
          label="Anticipos Pendientes" 
          value={pendingAdvances || 0} 
          trend={0} 
          subtitle={`Cobros en campo: ${pendingCollections || 0}`}
          color="text-blue-600" 
          bgColor="bg-blue-50"
          onClick={() => navigate('/caja')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts / Activity */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle size={20} className="mr-2 text-primary-600" />
              Alertas Críticas
            </h3>
            <div className="space-y-4">
              {criticalStockItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm font-medium">
                  No hay alertas de stock crítico en este momento.
                </div>
              ) : (
                criticalStockItems.map((item, idx) => (
                  <div 
                    key={item.id || idx} 
                    onClick={() => navigate('/inventario')}
                    className="flex space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-primary-100 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${item.total_stock <= 0 ? 'bg-red-500' : 'bg-orange-500'} mt-1.5 shrink-0 group-hover:animate-pulse`}></div>
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                      <p className="text-gray-500 text-xs mt-1">
                        {item.total_stock <= 0 
                          ? `Agotado (Físico: ${item.total_stock})` 
                          : `Solo quedan ${item.total_stock} (Mínimo: ${item.min_stock})`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate('/inventario')}
            className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-primary-400 hover:text-primary-600 transition-all text-sm cursor-pointer"
          >
            Ver todos los productos
          </button>
        </div>

        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <BarChart3 size={20} className="mr-2 text-primary-600" />
                Rendimiento Semanal
              </h3>
              <p className="text-gray-400 text-xs mt-1 font-medium">Ventas diarias en pesos de los últimos 7 días</p>
            </div>
            <span className="bg-primary-50 text-primary-600 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider">
              Pesos (MXN)
            </span>
          </div>

          <div className="flex-grow flex items-end justify-between gap-3 md:gap-5 pt-8 pb-4 px-2 min-h-[240px]">
            {weeklySales.map((day, idx) => {
              const maxAmount = Math.max(...weeklySales.map(d => d.amount), 1000)
              const heightPercent = Math.min((day.amount / maxAmount) * 100, 100)
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute -top-10 bg-gray-900/95 text-white text-[10px] font-black px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-20 backdrop-blur-sm border border-gray-800">
                    ${day.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                  
                  {/* Bar wrapper */}
                  <div className="w-full bg-gray-50/50 rounded-t-2xl flex items-end h-full">
                    {/* Bar */}
                    <div 
                      style={{ height: `${Math.max(heightPercent, day.amount > 0 ? 4 : 0)}%` }}
                      className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-2xl group-hover:from-primary-700 group-hover:to-primary-500 transition-all duration-500 shadow-sm shadow-primary-50/50 animate-in slide-in-from-bottom duration-700 ease-out"
                    ></div>
                  </div>
                  
                  {/* Labels */}
                  <span className="text-gray-500 text-[10px] font-black mt-3 uppercase tracking-wider group-hover:text-primary-600 transition-colors">{day.dayName}</span>
                  <span className="text-gray-400 text-[9px] font-bold mt-0.5">{day.date.split('-')[2]}/{day.date.split('-')[1]}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
