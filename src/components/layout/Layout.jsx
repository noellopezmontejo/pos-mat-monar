import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Settings, 
  LogOut, CreditCard, BarChart3, Database, ShoppingBag,
  ChevronLeft, ChevronRight, Menu, Wallet, FileText, ShieldCheck, Banknote
} from 'lucide-react'
import { useCompany } from '../../contexts/CompanyContext'

const SidebarItem = ({ icon: Icon, label, href, active, collapsed, onClick }) => (
  <Link 
    to={href} 
    onClick={onClick}
    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
        : 'text-gray-500 hover:bg-primary-50 hover:text-primary-600'
    } ${collapsed ? 'justify-center space-x-0' : ''}`}
    title={collapsed ? label : ''}
  >
    <Icon size={22} className="min-w-[22px]" />
    {!collapsed && <span className="font-bold text-sm tracking-tight truncate animate-in fade-in duration-300">{label}</span>}
  </Link>
)

const Layout = ({ children }) => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { profile } = useCompany()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002'
  
  const userStr = localStorage.getItem('user')
  let user = { name: 'Usuario', role: 'Invitado' }
  try {
     if (userStr) user = JSON.parse(userStr)
  } catch (e) {}

  const isPwaUser = user.role === 'Almacenista' || user.role === 'Chofer'
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: ShoppingCart, label: 'Venta Directa', href: '/punto-venta' },
    { icon: ShieldCheck, label: 'Ventas Especiales', href: '/ventas-especiales' },
    { icon: Package, label: 'Inventario', href: '/inventario' },
    { icon: ShoppingBag, label: 'Compras y Proveedores', href: '/compras' },
    { icon: Users, label: 'Clientes', href: '/clientes' },
    { icon: Truck, label: 'Logística', href: '/logistica' },
    { icon: Users, label: 'Personal / Usuarios', href: '/usuarios' },
    { icon: Wallet, label: 'Cuentas por Pagar', href: '/cuentas-por-pagar' },
    { icon: Banknote, label: 'Caja', href: '/caja' },
    { icon: CreditCard, label: 'Cobranza de Clientes', href: '/cobranza' },
    { icon: BarChart3, label: 'Reportes', href: '/reportes' },
    { icon: Database, label: 'Migración', href: '/migracion' },
    { icon: Package, label: 'Almacén PWA', href: '/almacen' },
    { icon: Truck, label: 'Chofer PWA', href: '/chofer' },
    { icon: ShoppingCart, label: 'Ventas Directas PWA', href: '/ventas-pwa' },
    { icon: FileText, label: 'Órdenes PWA (Especial)', href: '/ordenes-pwa' },
    { icon: CreditCard, label: 'Facturación', href: '/facturacion' },
  ]

  if (isPwaUser) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-auto">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    )
  }

  // Branding dynamic data
  const appName = profile?.app_name || 'NC INTEGRAX'
  const appIcon = profile?.app_icon_url ? `${apiUrl}${profile.app_icon_url}` : null
  const showByNC = profile?.show_by_nc !== false

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans print:h-auto print:overflow-visible">
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white border-r border-gray-100 flex flex-col p-6 space-y-8 transition-all duration-500 ease-in-out relative group print:hidden`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-primary-600 shadow-sm transition-all z-50 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 text-left'} px-2 overflow-hidden`}>
          {appIcon ? (
             <img src={appIcon} alt="App Icon" className="w-10 h-10 object-contain rounded-xl shadow-sm bg-white p-1" />
          ) : (
             <div className="w-10 h-10 min-w-[40px] bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-200">
               {appName.charAt(0).toUpperCase()}
             </div>
          )}
          
          {!isCollapsed && (
            <span className="text-xl font-black text-gray-900 tracking-tighter truncate animate-in slide-in-from-left-2 duration-300">
              {appName}
            </span>
          )}
        </div>
        
        <nav className="flex-grow space-y-1 custom-scrollbar overflow-y-auto px-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.href} 
              {...item} 
              active={location.pathname === item.href} 
              collapsed={isCollapsed}
            />
          ))}
        </nav>
        
        <div className="pt-6 border-t border-gray-100 space-y-1">
          <SidebarItem 
            icon={Settings} 
            label="Configuración" 
            href="/configuracion" 
            active={location.pathname === '/configuracion'} 
            collapsed={isCollapsed} 
          />
          <button 
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center space-x-0' : 'space-x-3'} p-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all duration-200`}
          >
            <LogOut size={22} className="min-w-[22px]" />
            {!isCollapsed && <span className="font-bold text-sm tracking-tight">Cerrar Sesión</span>}
          </button>

          {!isCollapsed && (
            <div className="text-center mt-4 pb-2">
               <p className="text-[9px] font-black uppercase text-gray-300 tracking-[0.2em]">{appName} &copy; {new Date().getFullYear()}</p>
               {showByNC && <p className="text-[9px] font-black uppercase text-primary-400 tracking-widest mt-0.5">by NetConsultores</p>}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-grow overflow-auto p-4 md:p-8 relative bg-gray-50/50 print:p-0 print:overflow-visible print:h-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
               {appIcon ? (
                  <img src={appIcon} className="w-10 h-10 object-contain rounded-xl" />
               ) : (
                  <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black">{appName.charAt(0)}</div>
               )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter capitalize drop-shadow-sm">
                {location.pathname === '/' || location.pathname === '/dashboard' ? 'Resumen Ejecutivo' : location.pathname.substring(1).replace('-', ' ')}
              </h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Status: Conexión Estable (SAE 4.6)</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white p-3 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-col text-right">
              <span className="font-black text-gray-900 text-xs tracking-tight">{user.name}</span>
              <span className="text-[10px] text-green-500 font-black uppercase tracking-tighter flex items-center justify-end">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                {user.role}
              </span>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-2xl border-2 border-white shadow-md overflow-hidden ring-2 ring-primary-50">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0ea5e9&color=fff`} alt="Avatar" />
            </div>
          </div>
        </header>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout
