import axios from 'axios';

// Obtener la URL de la API desde las variables de entorno de Vite o usar el valor por defecto
// En Android/PWA se DEBE usar la IP local (ej. 192.168.1.141) no localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4002';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación a todas las peticiones
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores globales (ej. 401 Unauthorized)
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    // Si el token es inválido o expiró, podríamos redirigir al login
    console.warn('Sesión expirada o no autorizada');
    // localStorage.removeItem('token');
    // window.location.href = '/login';
  }
  console.error('API Error:', error.response?.data || error.message);
  return Promise.reject(error);
});

export default apiClient;
export { API_URL };
