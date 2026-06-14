import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DirectSalesPOS from './pages/DirectSalesPOS'
import SpecialSalesPOS from './pages/SpecialSalesPOS'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Logistics from './pages/Logistics'
import DriverPWA from './pages/DriverPWA'
import WarehousePWA from './pages/WarehousePWA'
import Facturacion from './pages/Facturacion'
import Purchases from './pages/Purchases'
import Migration from './pages/Migration'
import UsersPage from './pages/Users'
import AccountsPayable from './pages/AccountsPayable'
import CashRegister from './pages/AccountsReceivable' // For now, reusing AccountsReceivable for Caja
import Collections from './pages/Collections'
import SalesPWA from './pages/SalesPWA'
import OrdersPWA from './pages/OrdersPWA'
import Settings from './pages/Settings'
import Reports from './pages/Reports'

import { CompanyProvider } from './contexts/CompanyContext'
import SplashScreen from './components/common/SplashScreen'

function RootRedirect() {
  const userStr = localStorage.getItem('user')
  if (!userStr) return <Navigate to="/login" replace />
  
  try {
    const user = JSON.parse(userStr)
    if (user.role === 'Almacenista') return <Navigate to="/almacen" replace />
    if (user.role === 'Chofer') return <Navigate to="/chofer" replace />
    if (user.role === 'Vendedor Mostrador' || user.role === 'Vendedor Cajero') return <Navigate to="/punto-venta" replace />
    if (user.role === 'Facturista') return <Navigate to="/facturacion" replace />
    if (user.role === 'Área Contable') return <Navigate to="/caja" replace />
    return <Navigate to="/dashboard" replace />
  } catch (e) {
    return <Navigate to="/login" replace />
  }
}

const isRouteAllowed = (path, role) => {
  if (role === 'Administrador') return true;
  if (role === 'Gerente') {
    return path !== '/usuarios' && path !== '/migracion' && path !== '/configuracion';
  }
  if (role === 'Vendedor Mostrador') {
    return path === '/' || path === '/punto-venta' || path === '/clientes';
  }
  if (role === 'Vendedor Cajero') {
    return path === '/' || path === '/punto-venta' || path === '/caja' || path === '/clientes';
  }
  if (role === 'Facturista') {
    return path === '/' || path === '/facturacion' || path === '/punto-venta' || path === '/clientes';
  }
  if (role === 'Área Contable') {
    return path === '/' || path === '/caja' || path === '/cobranza' || path === '/cuentas-por-pagar' || path === '/facturacion' || path === '/reportes';
  }
  if (role === 'Almacenista') {
    return path === '/' || path === '/almacen';
  }
  if (role === 'Chofer') {
    return path === '/' || path === '/chofer';
  }
  return false;
}

function AppContent({ token, setToken }) {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={(user) => setToken(localStorage.getItem('token'))} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  const userStr = localStorage.getItem('user')
  let role = 'Invitado'
  try {
    if (userStr) role = JSON.parse(userStr).role
  } catch (e) {}

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          {isRouteAllowed('/dashboard', role) && <Route path="/dashboard" element={<Dashboard />} />}
          {isRouteAllowed('/punto-venta', role) && <Route path="/punto-venta" element={<DirectSalesPOS />} />}
          {isRouteAllowed('/ventas-especiales', role) && <Route path="/ventas-especiales" element={<SpecialSalesPOS />} />}
          {isRouteAllowed('/inventario', role) && <Route path="/inventario" element={<Inventory />} />}
          {isRouteAllowed('/clientes', role) && <Route path="/clientes" element={<Customers />} />}
          {isRouteAllowed('/logistica', role) && <Route path="/logistica" element={<Logistics />} />}
          {isRouteAllowed('/chofer', role) && <Route path="/chofer" element={<DriverPWA />} />}
          {isRouteAllowed('/almacen', role) && <Route path="/almacen" element={<WarehousePWA />} />}
          {isRouteAllowed('/ventas-pwa', role) && <Route path="/ventas-pwa" element={<SalesPWA />} />}
          {isRouteAllowed('/ordenes-pwa', role) && <Route path="/ordenes-pwa" element={<OrdersPWA />} />}
          {isRouteAllowed('/facturacion', role) && <Route path="/facturacion" element={<Facturacion />} />}
          {isRouteAllowed('/compras', role) && <Route path="/compras" element={<Purchases />} />}
          {isRouteAllowed('/usuarios', role) && <Route path="/usuarios" element={<UsersPage />} />}
          {isRouteAllowed('/cuentas-por-pagar', role) && <Route path="/cuentas-por-pagar" element={<AccountsPayable />} />}
          {isRouteAllowed('/caja', role) && <Route path="/caja" element={<CashRegister />} />}
          {isRouteAllowed('/cobranza', role) && <Route path="/cobranza" element={<Collections />} />}
          {isRouteAllowed('/reportes', role) && <Route path="/reportes" element={<Reports />} />}
          {isRouteAllowed('/configuracion', role) && <Route path="/configuracion" element={<Settings />} />}
          {isRouteAllowed('/migracion', role) && <Route path="/migracion" element={<Migration />} />}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

function App() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    return t && u ? t : null
  })

  useEffect(() => {
    const handleStorageChange = () => {
      const t = localStorage.getItem('token')
      const u = localStorage.getItem('user')
      setToken(t && u ? t : null)
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <CompanyProvider>
      <AppContent token={token} setToken={setToken} />
    </CompanyProvider>
  )
}

export default App
