import React, { useState, useEffect } from 'react'
import { 
  Users as UsersIcon, UserPlus, Search, 
  Trash2, Edit3, Shield, Key, 
  User, Check, X, ShieldCheck, Mail, Truck
} from 'lucide-react'
import axios from 'axios'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('add') // 'add' or 'edit'
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [drivers, setDrivers] = useState([])

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'Vendedor Mostrador',
    driverId: ''
  })

  const roles = [
    'Administrador',
    'Gerente',
    'Vendedor Mostrador',
    'Vendedor Cajero',
    'Facturista',
    'Almacenista',
    'Chofer',
    'Área Contable'
  ]

  const getHeaders = () => {
    const token = localStorage.getItem('token')
    return { headers: { 'Authorization': `Bearer ${token}` } }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'
      const res = await axios.get(`${apiUrl}/api/users`, getHeaders())
      setUsers(res.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'
      const res = await axios.get(`${apiUrl}/api/logistics/drivers/active`, getHeaders())
      setDrivers(res.data)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDrivers()
  }, [])

  const handleOpenAdd = () => {
    setModalType('add')
    setFormData({ username: '', password: '', name: '', role: 'Vendedor Mostrador', driverId: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setModalType('edit')
    setFormData({ 
      username: user.username, 
      password: '', // Leave empty unless changing
      name: user.name, 
      role: user.role,
      driverId: user.driverId || ''
    })
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'
    try {
      if (modalType === 'add') {
        await axios.post(`${apiUrl}/api/users`, formData, getHeaders())
      } else {
        await axios.put(`${apiUrl}/api/users/${selectedUser.id}`, formData, getHeaders())
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'No se pudo guardar el usuario'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001'
      await axios.delete(`${apiUrl}/api/users/${id}`, getHeaders())
      fetchUsers()
    } catch (error) {
      alert('Error al eliminar usuario')
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200">
            <UsersIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Personal y Usuarios</h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Gestión de Accesos y Roles</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar personal..."
              className="pl-12 pr-6 py-3 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-500 w-64 font-bold text-gray-700 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={18} />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuario</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre Completo</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol / Función</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-20 font-bold text-gray-400 animate-pulse">Cargando personal...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-20 font-bold text-gray-400 italic">No se encontró personal registrado</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-black text-gray-900 tracking-tight">@{user.username}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="font-bold text-gray-700">{user.name}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center w-fit ${
                    user.role === 'Administrador' ? 'bg-red-50 text-red-600' : 
                    user.role === 'Gerente' ? 'bg-orange-50 text-orange-600' :
                    user.role === 'Almacenista' ? 'bg-green-50 text-green-600' :
                    user.role === 'Chofer' ? 'bg-blue-50 text-blue-600' :
                    'bg-primary-50 text-primary-600'
                  }`}>
                    <Shield size={12} className="mr-2" />
                    {user.role}
                  </span>
                  {user.role === 'Chofer' && user.driver && (
                    <div className="flex items-center gap-2 mt-1 px-3">
                      <Truck size={12} className="text-gray-400"/>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Vínculo: {user.driver.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                  {modalType === 'add' ? <UserPlus size={20} /> : <Edit3 size={20} />}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 tracking-tighter">
                    {modalType === 'add' ? 'Registrar Usuario' : 'Editar Usuario'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                    {modalType === 'add' ? 'Nuevo integrante del equipo' : 'Actualizando perfil'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    required
                    type="text" 
                    placeholder="Ej: Juan Perez"
                    className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-500 font-bold text-gray-700"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Usuario</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required
                      disabled={modalType === 'edit'}
                      type="text" 
                      placeholder="jperez"
                      className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-500 font-bold text-gray-700 disabled:opacity-50"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      required={modalType === 'add'}
                      type="password" 
                      placeholder={modalType === 'add' ? '••••••••' : 'Cambiar...'}
                      className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-500 font-bold text-gray-700"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rol / Función</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select 
                    className="w-full pl-12 pr-6 py-3.5 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-primary-500 font-bold text-gray-700 appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === 'Chofer' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-primary-600 uppercase tracking-widest ml-1">Vincular a Perfil de Chofer</label>
                  <div className="relative">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={18} />
                    <select 
                      required
                      className="w-full pl-12 pr-6 py-3.5 bg-primary-50 rounded-2xl outline-none border border-primary-100 focus:border-primary-500 font-bold text-primary-900 appearance-none shadow-inner"
                      value={formData.driverId}
                      onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    >
                      <option value="">Selecciona el chofer...</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.vehicle?.plate || 'Sin placa'})</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold ml-1">Esto evitará que el usuario tenga que elegirse de una lista en la PWA.</p>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm tracking-tight hover:bg-gray-800 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2"
              >
                <Check size={18} />
                <span>{modalType === 'add' ? 'Registrar mi Personal' : 'Guardar Cambios'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
