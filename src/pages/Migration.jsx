import React, { useState } from 'react'
import { Database, AlertTriangle, CheckCircle, RefreshCw, Server, ArrowRight } from 'lucide-react'
import axios from 'axios'

const Migration = () => {
  const [config, setConfig] = useState({
    user: 'sa',
    password: '',
    server: 'localhost',
    database: 'sae4',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  })

  const [loadingEntity, setLoadingEntity] = useState(null)
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })
  const [selectedYear, setSelectedYear] = useState('Todos')

  React.useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/migration/progress');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };
    eventSource.onerror = () => {
      // Reconectar si falla
    };
    return () => eventSource.close();
  }, []);

  const appendLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
  }

  const runMigration = async (entity, label) => {
    setLoadingEntity(entity)
    appendLog(`Iniciando conexión para extraer [${label}]...`, 'info')

    try {
      setProgress({ current: 0, total: 0, message: 'Iniciando...' })
      const res = await axios.post('http://localhost:3001/api/migration/start', {
        config,
        entity,
        year: selectedYear
      }, {
        timeout: 0 // Infinito, el servidor ya maneja el tiempo correctamente
      })
      appendLog(`âœ… Éxito: ${res.data.report.message}`, 'success')
    } catch (err) {
      appendLog(`âŒ Error en ${label}: ${err.response?.data?.error || err.message}`, 'error')
    } finally {
      setLoadingEntity(null)
    }
  }

  const testConnection = async () => {
    setLoadingEntity('test')
    appendLog(`Verificando conectividad con servidor SQL ${config.server}...`, 'info')
    try {
      const res = await axios.post('http://localhost:3001/api/migration/test-connection', { config })
      appendLog(`âœ… Éxito: ${res.data.message}`, 'success')
      alert(res.data.message)
    } catch (err) {
      appendLog(`âŒ Error conectando: ${err.response?.data?.error || err.message}`, 'error')
      alert(`Error: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoadingEntity(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Origen de Datos</h2>
              <p className="text-sm text-gray-500">Conexión a ASPEL SAE (SQL Server)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Servidor / Instancia</label>
              <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.server} onChange={e => setConfig({ ...config, server: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Base de Datos</label>
              <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.database} onChange={e => setConfig({ ...config, database: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Usuario</label>
                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.user} onChange={e => setConfig({ ...config, user: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input type="password" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.password} onChange={e => setConfig({ ...config, password: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Encriptación SSL</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.options.encrypt} onChange={e => setConfig({ ...config, options: { ...config.options, encrypt: e.target.value === 'true' } })}>
                  <option value="false">Opcional / Falso</option>
                  <option value="true">Requerido / Verdadero</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confiar en Certificado</label>
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={config.options.trustServerCertificate} onChange={e => setConfig({ ...config, options: { ...config.options, trustServerCertificate: e.target.value === 'true' } })}>
                  <option value="true">Sí (Recomendado local)</option>
                  <option value="false">No (Estricto)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center justify-between">
                <span>Filtrar por Año (Opcional)</span>
                {selectedYear !== 'Todos' && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black uppercase">Filtrado</span>}
              </label>
              <select
                className={`w-full p-3 bg-gray-50 border ${selectedYear !== 'Todos' ? 'border-red-200 ring-2 ring-red-500/10' : 'border-gray-200'} rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold`}
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
              >
                <option value="Todos">Todos (Histórico Completo)</option>
                {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={testConnection}
              disabled={loadingEntity === 'test'}
              className="w-full mt-4 flex justify-center items-center py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {loadingEntity === 'test' ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Server size={18} className="mr-2" />}
              {loadingEntity === 'test' ? 'Pingeando Servidor...' : 'Probar Conexión con ASPEL'}
            </button>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl">
          <h3 className="flex items-center text-orange-800 font-bold mb-2">
            <AlertTriangle size={18} className="mr-2" /> Precauciones
          </h3>
          <p className="text-sm text-orange-700 leading-relaxed">
            Las migraciones de Compras y Ventas requieren que los Catálogos de Inventarios y Clientes ya existan en PostgreSQL. Ejecuta los módulos en el orden sugerido.
            <strong> Tiempos prolongados:</strong> Catálogos amplios pueden demorar un par de minutos en cargar.
          </p>
        </div>
      </div>

      {/* Migration Actions & Logs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-3 text-blue-600" /> Módulos de Extracción (ETL) <span className="ml-2 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
            </div>
            {loadingEntity && progress.total > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-100">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            )}
          </h2>

          {loadingEntity && progress.total > 0 && (
            <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between text-xs font-black text-blue-800 mb-3 uppercase tracking-wider">
                <span className="flex items-center">
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  {progress.message || 'Sincronizando registros...'}
                </span>
                <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
              </div>
              <div className="w-full bg-blue-200/50 rounded-full h-4 p-1 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                  style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('clients', 'Catálogo de Clientes y Proveedores')}
              className="flex flex-col items-start p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-gray-900">1. Clientes y Prov.</span>
                {loadingEntity === 'clients' ? <RefreshCw className="animate-spin text-blue-500" size={20} /> : <ArrowRight className="text-gray-400" size={20} />}
              </div>
              <p className="text-xs text-gray-500 text-left">Extrae ambos catálogos: CLIE01 y PROV01 unidos.</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('taxschemes', 'Esquemas de Impuestos (IMPU01)')}
              className="flex flex-col items-start p-5 bg-orange-50 border border-orange-200 rounded-2xl hover:bg-orange-100 transition-all disabled:opacity-50 group"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-orange-900">1.4. Esquemas Impuestos</span>
                {loadingEntity === 'taxschemes' ? <RefreshCw className="animate-spin text-orange-600" size={20} /> : <ArrowRight className="text-orange-400 group-hover:translate-x-1 transition-transform" size={20} />}
              </div>
              <p className="text-xs text-orange-700 text-left">Importa IMPU01 (Tasas de IVA, Retenciones y Cuentas).</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('lines', 'Líneas (CLIN01)')}
              className="flex flex-col items-start p-5 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-all disabled:opacity-50 group"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-blue-900">1.5. Líneas (CLIN01)</span>
                {loadingEntity === 'lines' ? <RefreshCw className="animate-spin text-blue-600" size={20} /> : <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform" size={20} />}
              </div>
              <p className="text-xs text-blue-700 text-left">Importa CLIN01 incluyendo cuentas COI y registros maestros.</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('products', 'Catálogo de Productos (INVE01)')}
              className="flex flex-col items-start p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-gray-900">2. Inventarios (INVE01)</span>
                {loadingEntity === 'products' ? <RefreshCw className="animate-spin text-blue-500" size={20} /> : <ArrowRight className="text-gray-400" size={20} />}
              </div>
              <p className="text-xs text-gray-500 text-left">Extrae códigos (CLV_ART), precios re-calculados y stock.</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('purchases', 'Histórico de Compras (COMP01/COM0Y1)')}
              className="flex flex-col items-start p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-gray-900">3. Compras (COMP01)</span>
                {loadingEntity === 'purchases' ? <RefreshCw className="animate-spin text-blue-500" size={20} /> : <ArrowRight className="text-gray-400" size={20} />}
              </div>
              <p className="text-xs text-gray-500 text-left">Absorbe las Órdenes de Compra vinculadas a su Proveedor real.</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('sales', 'Facturación Real (FACT01)')}
              className="flex flex-col items-start p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-gray-900">4. Facturación (FACT01 + FA0TY1)</span>
                {loadingEntity === 'sales' ? <RefreshCw className="animate-spin text-blue-500" size={20} /> : <ArrowRight className="text-gray-400" size={20} />}
              </div>
              <p className="text-xs text-gray-500 text-left">Trae el registro detallado de facturas y partidas FACT01 / FA0TY1.</p>
            </button>

            <button
              disabled={loadingEntity !== null}
              onClick={() => runMigration('kardex', 'Movimientos de Inventario (MINV01)')}
              className="flex flex-col items-start p-5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all disabled:opacity-50"
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-black text-blue-900">5. Kardex Histórico (MINV01)</span>
                {loadingEntity === 'kardex' ? <RefreshCw className="animate-spin text-blue-600" size={20} /> : <ArrowRight className="text-blue-400" size={20} />}
              </div>
              <p className="text-xs text-blue-600 text-left font-medium text-opacity-80">Migra el historial completo de entradas y salidas de cada producto.</p>
            </button>
          </div>
        </div>

        {/* Migration Terminal Logs */}
        <div className="bg-gray-900 rounded-3xl p-6 font-mono border border-gray-800 shadow-xl h-[300px] flex flex-col">
          <h3 className="text-gray-400 font-bold mb-4 flex items-center text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            Terminal de Sincronización
          </h3>
          <div className="flex-grow overflow-auto custom-scrollbar space-y-2">
            {logs.length === 0 && <p className="text-gray-600 italic text-sm">Esperando instrucciones...</p>}
            {logs.map((log, i) => (
              <div key={i} className="text-sm">
                <span className="text-gray-500 mr-3">[{log.time}]</span>
                <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-300'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Migration
