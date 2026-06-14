import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { getApiUrl } from '../utils/apiClient'

const CompanyContext = createContext()

export const useCompany = () => useContext(CompanyContext)

export const CompanyProvider = ({ children }) => {
  const [profile, setProfile] = useState({ name: 'CIMENTA' })
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const apiUrl = getApiUrl()
    console.log('[CompanyContext Debug] Starting fetchProfile. URL:', `${apiUrl}/api/config/profile`);
    try {
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      console.log('[CompanyContext Debug] Sending axios.get request...');
      const res = await axios.get(`${apiUrl}/api/config/profile`, { 
        headers,
        timeout: 3500
      })
      console.log('[CompanyContext Debug] Request success. Data:', res.data);
      if (res.data) setProfile(res.data)
    } catch (error) {
      console.error('[CompanyContext Debug] Request error:', error)
    } finally {
      console.log('[CompanyContext Debug] Setting loading to false');
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return (
    <CompanyContext.Provider value={{ profile, fetchProfile, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}
