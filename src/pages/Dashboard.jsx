import React from 'react'
import { TrendingUp, Users, Package, AlertCircle, ShoppingBag, Clock, BarChart3 } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, trend, color, bgColor }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition-shadow">
    <div>
      <span className="text-gray-500 text-sm font-medium">{label}</span>
      <h3 className="text-2xl font-black text-gray-900 mt-1">{value}</h3>
      <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        <TrendingUp size={16} className={`mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
        <span className="font-bold">{Math.abs(trend)}%</span>
        <span className="text-gray-400 ml-1 font-normal">vs ayer</span>
      </div>
    </div>
    <div className={`p-4 rounded-2xl ${bgColor}`}>
      <Icon size={24} className={color} />
    </div>
  </div>
)

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={ShoppingBag} 
          label="Ventas del Día" 
          value="$45,280.00" 
          trend={12.5} 
          color="text-primary-600" 
          bgColor="bg-primary-50"
        />
        <StatCard 
          icon={Users} 
          label="Clientes Nuevos" 
          value="24" 
          trend={-5.2} 
          color="text-orange-600" 
          bgColor="bg-orange-50"
        />
        <StatCard 
          icon={Package} 
          label="Stock Bajo" 
          value="15" 
          trend={0} 
          color="text-red-600" 
          bgColor="bg-red-50"
        />
        <StatCard 
          icon={Clock} 
          label="Anticipos Pendientes" 
          value="8" 
          trend={4.3} 
          color="text-blue-600" 
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts / Activity */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle size={20} className="mr-2 text-primary-600" />
            Alertas Críticas
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white transition-colors cursor-pointer group">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0 group-hover:animate-pulse"></div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Stock Crítico: Cemento Cruz Azul</h4>
                  <p className="text-gray-500 text-xs mt-1">Solo quedan 5 bultos en Bodega A.</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-bold hover:border-primary-400 hover:text-primary-600 transition-all text-sm">
            Ver todas las alertas
          </button>
        </div>

        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
           <div className="text-center">
              <BarChart3 size={64} className="mx-auto text-primary-100 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">Rendimiento Semanal</h3>
              <p className="text-gray-500 max-w-xs mt-2">Próximamente: Gráficas detalladas de ventas e inventario.</p>
           </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
