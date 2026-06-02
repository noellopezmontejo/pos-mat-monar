import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// --- INTERCEPTOR DE RED Y REESCRITURA DE IPS DINÁMICAS (PC CLIENTES) ---
// 1. Interceptar todas las peticiones globales de Axios
axios.interceptors.request.use((config) => {
  const savedIp = localStorage.getItem('server_ip')
  if (savedIp && config.url) {
    let baseIp = savedIp.trim()
    if (!baseIp.startsWith('http://') && !baseIp.startsWith('https://')) {
      baseIp = `http://${baseIp}`
    }

    if (config.url.startsWith('/') || 
        config.url.startsWith('http://localhost') || 
        config.url.startsWith('http://127.0.0.1') ||
        config.url.includes('/api/')) {
      
      let pathname = config.url
      let search = ''
      
      if (config.url.startsWith('http://') || config.url.startsWith('https://')) {
        try {
          const urlObj = new URL(config.url)
          pathname = urlObj.pathname
          search = urlObj.search
        } catch (e) {}
      }
      
      if (!pathname.startsWith('/')) {
        pathname = '/' + pathname
      }
      
      config.url = `${baseIp}${pathname}${search}`
    }
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// 1.5 Interceptar todas las peticiones globales de window.fetch
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const savedIp = localStorage.getItem('server_ip')
  if (savedIp && typeof resource === 'string') {
    let baseIp = savedIp.trim()
    if (!baseIp.startsWith('http://') && !baseIp.startsWith('https://')) {
      baseIp = `http://${baseIp}`
    }
    
    if (resource.startsWith('/') || 
        resource.startsWith('http://localhost') || 
        resource.startsWith('http://127.0.0.1') ||
        resource.includes('/api/')) {
          
      let pathname = resource
      let search = ''
      
      if (resource.startsWith('http://') || resource.startsWith('https://')) {
        try {
          const urlObj = new URL(resource)
          pathname = urlObj.pathname
          search = urlObj.search
        } catch (e) {}
      }
      
      if (!pathname.startsWith('/')) {
        pathname = '/' + pathname
      }
      
      resource = `${baseIp}${pathname}${search}`
    }
  }
  return originalFetch(resource, config);
};

// 2. Interceptar la inserción de imágenes en el DOM para reescribir sus URLs
const rewriteImg = (img) => {
  const savedIp = localStorage.getItem('server_ip')
  if (!savedIp) return

  let baseIp = savedIp.trim()
  if (!baseIp.startsWith('http://') && !baseIp.startsWith('https://')) {
    baseIp = `http://${baseIp}`
  }

  const src = img.getAttribute('src')
  if (src && (
    src.startsWith('http://localhost') || 
    src.startsWith('http://127.0.5') || // Catching local mock paths if any
    src.startsWith('http://127.0.0.1') || 
    src.includes('/uploads/')
  )) {
    try {
      let pathname = src
      let search = ''
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const urlObj = new URL(src)
        pathname = urlObj.pathname
        search = urlObj.search
      }
      if (!pathname.startsWith('/')) {
        pathname = '/' + pathname
      }
      img.setAttribute('src', `${baseIp}${pathname}${search}`)
    } catch (e) {}
  }
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.tagName === 'IMG') {
          rewriteImg(node)
        } else if (node.querySelectorAll) {
          const imgs = node.querySelectorAll('img')
          for (const img of imgs) {
            rewriteImg(img)
          }
        }
      }
    }
    // También vigilar cambios en atributos (por si el src se actualiza dinámicamente)
    if (mutation.type === 'attributes' && mutation.attributeName === 'src' && mutation.target.tagName === 'IMG') {
      rewriteImg(mutation.target)
    }
  }
})

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['src']
})
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
