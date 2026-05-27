// URL de la API centralizada para el frontend
export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002';

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};
