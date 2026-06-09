import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth as authApi } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)) }
      catch (e) { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login(username, password)
    const responseData = res.data || res
    const token = responseData.token
    const userData = responseData.user || responseData
    if (!token) throw new Error('No token received from server')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return responseData
  }

  const register = async (username, email, password) => {
    const res = await authApi.register(username, email, password)
    const responseData = res.data || res
    const token = responseData.token
    const userData = responseData.user || responseData
    if (!token) throw new Error('No token received from server')
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return responseData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (updates) => {
    const newUser = { ...user, ...updates }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
