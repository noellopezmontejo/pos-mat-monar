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
    return <Navigate to="/dashboard" replace />
  } catch (e) {
    return <Navigate to="/login" replace />
  }
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

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/punto-venta" element={<DirectSalesPOS />} />
          <Route path="/ventas-especiales" element={<SpecialSalesPOS />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/clientes" element={<Customers />} />
          <Route path="/logistica" element={<Logistics />} />
          <Route path="/chofer" element={<DriverPWA />} />
          <Route path="/almacen" element={<WarehousePWA />} />
          <Route path="/ventas-pwa" element={<SalesPWA />} />
          <Route path="/ordenes-pwa" element={<OrdersPWA />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/compras" element={<Purchases />} />
          <Route path="/usuarios" element={<UsersPage />} />
          <Route path="/cuentas-por-pagar" element={<AccountsPayable />} />
          <Route path="/caja" element={<CashRegister />} />
          <Route path="/cobranza" element={<Collections />} />
          <Route path="/reportes" element={<Reports />} />
          <Route path="/configuracion" element={<Settings />} />
          <Route path="/migracion" element={<Migration />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
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
