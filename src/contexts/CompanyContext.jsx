import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const CompanyContext = createContext()

export const useCompany = () => useContext(CompanyContext)

export const CompanyProvider = ({ children }) => {
  const [profile, setProfile] = useState({ name: 'CIMENTA' })
  const [loading, setLoading] = useState(true)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4002'

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const res = await axios.get(`${apiUrl}/api/config/profile`, { headers })
      if (res.data) setProfile(res.data)
    } catch (error) {
      console.error('Error fetching company profile:', error)
    } finally {
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
