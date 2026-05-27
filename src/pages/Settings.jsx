import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { 
  Save, Building, Phone, MapPin, Mail, Globe, MessageSquare, Upload, 
  Image as ImageIcon, ArrowUp, ArrowDown, AlignLeft, AlignCenter, AlignRight,
  ShieldCheck, Lock, Unlock, Key, Monitor, Layout as LayoutIcon, Eye
} from 'lucide-react'
import { useCompany } from '../contexts/CompanyContext'
import { ThermalTicket } from '../components/ThermalTicket'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Settings() {
  const { profile, fetchProfile } = useCompany()
  const [activeTab, setActiveTab] = useState('general') // 'general', 'tickets', 'branding'

  const [formData, setFormData] = useState({
    name: 'CIMENTA',
    trade_name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    receipt_message: '',
    app_name: 'NC INTEGRAX',
    branding_key: '',
    show_by_nc: true
  })
  
  const [brandingKeyInput, setBrandingKeyInput] = useState('')
  const [brandingUnlocked, setBrandingUnlocked] = useState(false)
  
  const defaultTicketBlocks = [
    { id: 'logo', label: 'Logotipo', visible: true, align: 'center' },
    { id: 'trade_name', label: 'Razón Social / Nombre', visible: true, align: 'center' },
    { id: 'rfc', label: 'RFC', visible: true, align: 'center' },
    { id: 'address', label: 'Dirección Completa', visible: true, align: 'center' },
    { id: 'phone', label: 'Teléfono', visible: true, align: 'center' },
    { id: 'sale_info', label: 'Datos de Venta (Folio, Fecha)', visible: true, align: 'left' },
    { id: 'seller', label: 'Vendedor / Cajero', visible: true, align: 'left' },
    { id: 'customer', label: 'Datos del Cliente', visible: true, align: 'left' },
    { id: 'items_table', label: 'Tabla de Productos', visible: true, align: 'left' },
    { id: 'totals', label: 'Totales', visible: true, align: 'right' },
    { id: 'barcode', label: 'Código de Barras (Folio)', visible: true, align: 'center' },
    { id: 'message', label: 'Mensaje Final', visible: true, align: 'center' }
  ]

  const [ticketConfig, setTicketConfig] = useState(defaultTicketBlocks)

  const [logoPreview, setLogoPreview] = useState(null)
  const [appLogoPreview, setAppLogoPreview] = useState(null)
  const [appIconPreview, setAppIconPreview] = useState(null)
  
  const [selectedFiles, setSelectedFiles] = useState({
    logo: null,
    app_logo: null,
    app_icon: null
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  const fileInputRef = useRef(null)
  const appLogoInputRef = useRef(null)
  const appIconInputRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || 'CIMENTA',
        trade_name: profile.trade_name || '',
        rfc: profile.rfc || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        website: profile.website || '',
        receipt_message: profile.receipt_message || '',
        app_name: profile.app_name || 'NC INTEGRAX',
        branding_key: profile.branding_key || 'NC-2026-ADMIN',
        show_by_nc: profile.show_by_nc ?? true
      })
      
      if (profile.logo_url) setLogoPreview(`${apiUrl}${profile.logo_url}`)
      if (profile.app_logo_url) setAppLogoPreview(`${apiUrl}${profile.app_logo_url}`)
      if (profile.app_icon_url) setAppIconPreview(`${apiUrl}${profile.app_icon_url}`)
      
      if (profile.ticket_config) {
        let parsed = profile.ticket_config
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed) } catch(e) {}
        }
        if (Array.isArray(parsed)) setTicketConfig(parsed)
      }
    }
  }, [profile])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleToggleBlock = (id) => {
    setTicketConfig(prev => prev.map(block => block.id === id ? { ...block, visible: !block.visible } : block))
  }

  const handleMoveBlock = (index, direction) => {
    setTicketConfig(prev => {
      const newConfig = [...prev];
      if (direction === 'UP' && index > 0) {
        const temp = newConfig[index - 1];
        newConfig[index - 1] = newConfig[index];
        newConfig[index] = temp;
      } else if (direction === 'DOWN' && index < newConfig.length - 1) {
        const temp = newConfig[index + 1];
        newConfig[index + 1] = newConfig[index];
        newConfig[index] = temp;
      }
      return newConfig;
    });
  }

  const handleAlignBlock = (id, align) => {
    setTicketConfig(prev => prev.map(block => block.id === id ? { ...block, align } : block))
  }

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFiles(prev => ({ ...prev, [type]: file }))
      const preview = URL.createObjectURL(file)
      if (type === 'logo') setLogoPreview(preview)
      if (type === 'app_logo') setAppLogoPreview(preview)
      if (type === 'app_icon') setAppIconPreview(preview)
    }
  }

  const unlockBranding = () => {
    const input = brandingKeyInput.trim()
    const masterKey = (profile?.branding_key || 'NC-2026-ADMIN').trim()
    
    if (input === masterKey) {
      setBrandingUnlocked(true)
    } else {
      alert('Llave de acceso incorrecta')
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const data = new FormData()
      
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key])
      })
      
      data.append('ticket_config', JSON.stringify(ticketConfig))
      
      if (selectedFiles.logo) data.append('logo', selectedFiles.logo)
      if (selectedFiles.app_logo) data.append('app_logo', selectedFiles.app_logo)
      if (selectedFiles.app_icon) data.append('app_icon', selectedFiles.app_icon)

      await axios.post(`${apiUrl}/api/config/profile`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      
      alert('Configuración guardada exitosamente')
      fetchProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
             <Building className="text-primary-600" size={36} />
             Configuración Global
           </h1>
           <p className="text-sm font-bold text-gray-400 mt-2 tracking-widest uppercase">Identidad, Tickets y Marca</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-primary-200 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <span className="animate-pulse">Guardando...</span> : <><Save size={20}/> Guardar Cambios</>}
        </button>
      </div>

      <div className="flex space-x-4 border-b border-gray-100">
         <button onClick={() => setActiveTab('general')} className={`pb-4 px-4 font-black uppercase tracking-widest text-sm transition-colors ${activeTab === 'general' ? 'border-b-4 border-primary-500 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>General</button>
         <button onClick={() => setActiveTab('tickets')} className={`pb-4 px-4 font-black uppercase tracking-widest text-sm transition-colors ${activeTab === 'tickets' ? 'border-b-4 border-primary-500 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}>Tickets</button>
         <button onClick={() => setActiveTab('branding')} className={`pb-4 px-4 font-black uppercase tracking-widest text-sm transition-colors ${activeTab === 'branding' ? 'border-b-4 border-primary-500 text-primary-600' : 'text-gray-400 hover:text-gray-600'} flex items-center gap-2`}>
           <ShieldCheck size={16}/> Marca / Branding
         </button>
      </div>

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
           <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                 <div className="w-full aspect-square bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-6 overflow-hidden relative group">
                   {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-4 bg-white" /> : <div className="text-gray-300 flex flex-col items-center"><ImageIcon size={48} className="mb-2"/><span className="text-xs font-bold uppercase tracking-widest">Sin Logo</span></div>}
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <button onClick={() => fileInputRef.current.click()} className="px-6 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transform hover:scale-105 transition-all"><Upload size={16}/> Cambiar</button>
                   </div>
                 </div>
                 <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" className="hidden" />
                 <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Logo Tickets</h3>
              </div>
           </div>
           <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Operativo</label><input name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Razón Social</label><input name="trade_name" value={formData.trade_name} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">RFC</label><input name="rfc" value={formData.rfc} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold uppercase" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Teléfono</label><input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold" /></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dirección</label><textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold resize-none h-20" /></div>
                 <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label><input name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold" /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Web</label><input name="website" value={formData.website} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold" /></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6">Constructor Visual</h2>
              <div className="space-y-3">
                 {ticketConfig.map((block, index) => (
                    <div key={block.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border border-gray-200">
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                             <button onClick={() => handleMoveBlock(index, 'UP')} disabled={index === 0} className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowUp size={16} /></button>
                             <button onClick={() => handleMoveBlock(index, 'DOWN')} disabled={index === ticketConfig.length - 1} className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-30"><ArrowDown size={16} /></button>
                          </div>
                          <div>
                             <h4 className="font-black text-gray-900 text-sm">{block.label}</h4>
                             <div className="flex items-center gap-1 mt-1">
                                {['left', 'center', 'right'].map(a => (
                                  <button key={a} onClick={() => handleAlignBlock(block.id, a)} className={`p-1 rounded ${block.align === a ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-200'}`}>
                                     {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                       <button onClick={() => handleToggleBlock(block.id)} className={`relative inline-flex h-7 w-12 rounded-full border-2 border-transparent transition-colors ${block.visible ? 'bg-primary-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${block.visible ? 'translate-x-5' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 ))}
              </div>
              <div className="pt-8 mt-8 border-t"><label className="text-[10px] font-black text-gray-400 uppercase ml-1">Mensaje Footer</label><textarea name="receipt_message" value={formData.receipt_message} onChange={handleInputChange} className="w-full mt-2 px-4 py-3 bg-gray-50 border border-transparent focus:border-primary-200 rounded-xl font-bold h-20" /></div>
           </div>
           <div className="bg-gray-100 p-8 rounded-[2.5rem] border border-gray-200 flex flex-col items-center sticky top-8 h-fit">
              <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 mb-6">Vista Previa</h2>
              <div className="bg-white shadow-2xl p-4 scale-90 origin-top">
                 <ThermalTicket type="DIRECT" sale={{ folio: '123456', created_at: new Date().toISOString(), total_amount: 150000, customer: { name: 'Público General' } }} items={[{ quantity: 1, price: 150000, product: { name: 'Malla Electrosoldada' } }]} company={{ ...formData, logo_url: logoPreview ? logoPreview.replace(apiUrl, '') : null, ticket_config: ticketConfig }} />
              </div>
           </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
           {!brandingUnlocked ? (
             <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-primary-50 text-center space-y-6">
                <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg"><Lock size={40}/></div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Acceso Protegido</h2>
                <p className="text-gray-400 font-bold max-w-xs mx-auto">Esta sección permite modificar la identidad profunda de la aplicación. Se requiere la llave de marca.</p>
                <div className="relative max-w-xs mx-auto">
                   <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/>
                   <input type="password" placeholder="Ingresa la Llave..." className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-black text-xl text-center tracking-widest border border-transparent focus:border-primary-600 transition-all" value={brandingKeyInput} onChange={(e) => setBrandingKeyInput(e.target.value)} />
                </div>
                <button onClick={unlockBranding} className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-primary-500 transition-all flex items-center gap-2 mx-auto active:scale-95"><Unlock size={18}/> Desbloquear Sección</button>
             </div>
           ) : (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
                   <div className="flex items-center gap-4 border-b pb-6"><div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner"><ShieldCheck size={28}/></div><div><h3 className="text-xl font-black text-gray-900">Configuración de Marca</h3><p className="text-xs font-bold text-gray-400 uppercase">Personalización del Software (White Label)</p></div></div>
                   
                   <div className="space-y-6">
                      <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de la Aplicación (Splash & Título)</label><div className="relative"><Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18}/><input name="app_name" value={formData.app_name} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl font-black text-xl text-primary-900 outline-none focus:ring-2 ring-primary-100" /></div></div>
                      
                      <div className="grid grid-cols-2 gap-8 pt-4">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo Splash (Principal)</label>
                            <div className="aspect-video bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                               {appLogoPreview ? <img src={appLogoPreview} className="w-full h-full object-contain p-4" /> : <ImageIcon className="text-gray-200" size={48}/>}
                               <button onClick={() => appLogoInputRef.current.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest backdrop-blur-sm"><Upload className="mr-2"/> Cambiar</button>
                               <input type="file" ref={appLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'app_logo')} />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Icono Barra Navegación</label>
                            <div className="aspect-square w-32 bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group mx-auto">
                               {appIconPreview ? <img src={appIconPreview} className="w-full h-full object-contain p-2" /> : <LayoutIcon className="text-gray-200" size={32}/>}
                               <button onClick={() => appIconInputRef.current.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest backdrop-blur-sm">Ok</button>
                               <input type="file" ref={appIconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'app_icon')} />
                            </div>
                         </div>
                      </div>

                      <div className="pt-6 border-t flex items-center justify-between">
                         <div><p className="font-black text-gray-900 text-sm">Créditos "By Netconsultores"</p><p className="text-xs text-gray-400 font-bold">Muestra la firma del desarrollador en el Splash y Footer.</p></div>
                         <button onClick={() => setFormData(prev => ({ ...prev, show_by_nc: !prev.show_by_nc }))} className={`relative inline-flex h-8 w-14 rounded-full border-2 border-transparent transition-colors ${formData.show_by_nc ? 'bg-primary-600' : 'bg-gray-300'}`}><span className={`inline-block h-7 w-7 transform rounded-full bg-white transition ${formData.show_by_nc ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                      </div>

                      <div className="pt-6 border-t space-y-3">
                         <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12}/> Nueva Llave de Acceso (¡CUIDADO!)</label>
                         <input type="text" name="branding_key" value={formData.branding_key} onChange={handleInputChange} className="w-full px-6 py-4 bg-red-50 border border-red-100 rounded-2xl font-black text-gray-900 text-center tracking-[0.5em]" />
                         <p className="text-[9px] text-gray-400 font-bold text-center italic uppercase">Si olvidas esta llave, no podrás volver a entrar a esta sección.</p>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  )
}
