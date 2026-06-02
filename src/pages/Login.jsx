import React, { useState, useEffect } from 'react'
import { Lock, User, Key, ArrowRight, ShieldCheck, AlertCircle, Monitor, Settings } from 'lucide-react'
import apiClient from '../utils/apiClient'
import { useCompany } from '../contexts/CompanyContext'

const Login = ({ onLogin }) => {
  const { profile, loading: profileLoading } = useCompany()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Configuración de IP dinámica
  const [showIpConfig, setShowIpConfig] = useState(false)
  const [serverIp, setServerIp] = useState(localStorage.getItem('server_ip')?.replace('http://', '')?.replace('https://', '') || '')
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await apiClient.post('/api/auth/login', {
        username,
        password
      })
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      if (onLogin) onLogin(user)
      window.location.reload()
    } catch (err) {
      console.error('Login error:', err)
      setError(err.response?.data?.error || 'Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIp = (e) => {
    e.preventDefault()
    if (serverIp.trim() === '') {
      localStorage.removeItem('server_ip')
    } else {
      localStorage.setItem('server_ip', serverIp.trim())
    }
    window.location.reload()
  }

  const appName = profile?.app_name || 'NC INTEGRAX'
  const appIcon = profile?.app_icon_url ? `${apiUrl}${profile.app_icon_url}` : null
  const appLogo = profile?.app_logo_url ? `${apiUrl}${profile.app_logo_url}` : null
  const showByNC = profile?.show_by_nc !== false

  const displayImage = appIcon || appLogo;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-8 selection:bg-primary-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Container - Split Layout on Desktop */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full max-w-[1100px] relative z-10">
        
        {/* Left Side - Large Brand Icon */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="w-64 h-64 md:w-80 md:h-80 lg:w-[440px] lg:h-[440px] bg-white/5 backdrop-blur-3xl rounded-[3rem] lg:rounded-[4rem] shadow-2xl border border-white/10 flex items-center justify-center overflow-hidden hover:scale-105 transition-all duration-700 group">
            {profileLoading ? (
              <div className="w-32 h-32 bg-white/10 rounded-full animate-pulse" />
            ) : displayImage ? (
              <img 
                src={displayImage} 
                alt="App Brand" 
                className="w-full h-full object-contain p-8 lg:p-12 group-hover:p-6 lg:group-hover:p-8 transition-all duration-700 drop-shadow-2xl" 
              />
            ) : (
              <span className="text-white text-8xl lg:text-[12rem] font-black italic tracking-tighter">NC</span>
            )}
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="w-full lg:w-1/2 max-w-[440px] animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative">
            
            {/* Settings Gear Cog for IP Server configuration */}
            <button
              type="button"
              onClick={() => setShowIpConfig(!showIpConfig)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-white/5 transition-all duration-300 z-20"
              title="Configuración de IP de Servidor"
            >
              <Settings size={18} className={`transition-transform duration-500 ${showIpConfig ? 'rotate-90 text-primary-400' : ''}`} />
            </button>

            {/* Mobile Header (Hidden on LG) */}
            <div className="lg:hidden text-center mb-8">
               <h1 className="text-3xl font-black text-white tracking-tighter">{appName}</h1>
            </div>

            {/* Config panel if settings is open */}
            {showIpConfig && (
              <div className="mb-6 p-5 bg-slate-950/60 border border-white/10 rounded-2xl animate-in slide-in-from-top-4 duration-300 space-y-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="text-primary-400 shrink-0" size={18} />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Dirección IP del Servidor</h3>
                </div>
                
                <p className="text-[11px] text-slate-400 font-bold leading-normal">
                  Ingresa la IP o Host del servidor (ej: <code className="text-primary-300">192.168.1.175:4002</code> o el nombre de dominio).
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Ej: 192.168.1.175:4002"
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl outline-none focus:border-primary-500 text-white font-mono text-sm placeholder:text-slate-700 transition-all"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                  />
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('server_ip');
                        setServerIp('');
                        window.location.reload();
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all"
                    >
                      Por Defecto
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveIp}
                      className="flex-1 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-[10px] font-black tracking-widest uppercase transition-all"
                    >
                      Guardar IP
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre de Usuario</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej: nlopez"
                    className="w-full pl-12 pr-6 py-4 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-primary-500 text-white font-bold placeholder:text-slate-700 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña</label>
                </div>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-950/50 border border-white/5 rounded-2xl outline-none focus:border-primary-500 text-white font-bold placeholder:text-slate-700 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center space-x-3 text-red-400 animate-in shake duration-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-bold leading-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-2xl shadow-primary-600/20 transition-all active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar al Sistema</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <h2 className="text-white font-black tracking-tighter text-lg mb-1">{appName}</h2>
              <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
                &copy; {new Date().getFullYear()} {showByNC ? 'by NetConsultores' : ''} &bull; v2.5.2
              </p>
            </div>
          </div>
          
          {/* SECURE Badge */}
          <div className="absolute -top-4 -right-4 bg-blue-500 text-[10px] font-black text-white px-4 py-2 rounded-full shadow-lg rotate-12 animate-pulse hidden lg:block">
            SECURE NC-AES
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
