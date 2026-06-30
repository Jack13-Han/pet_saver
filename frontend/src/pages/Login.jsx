import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import Lottie from "lottie-react"
import petAnimation from "../assets/lottie/pet.json"
import { User, Mail, KeyRound } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.username, form.password)
      } else {
        await register(form.username, form.email, form.password)
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Is PHP server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <motion.div 
        className="login-card" 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
      >
        <div className="login-brand">
          <div className="login-brand-icon">
            <Lottie
              animationData={petAnimation}
              loop={true}
              style={{
                width: 140,
                height: 140
              }}
            />
          </div>
          <h1>Pet Saver</h1>
          <p>Grow with your savings</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={isLogin ? 'login' : 'register'} 
            className="login-form" 
            initial={{ x: 10, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: -10, opacity: 0 }} 
            onSubmit={handleSubmit}
          >
            {/* Username Input */}
            <div className="login-field-wrapper">
              <User size={18} className="login-field-icon" />
              <input 
                type="text" 
                className="login-input" 
                placeholder="Username" 
                value={form.username} 
                onChange={e => setForm({ ...form, username: e.target.value })} 
                required 
                minLength={3} 
              />
            </div>

            {/* Email Input (Register only) */}
            {!isLogin && (
              <div className="login-field-wrapper">
                <Mail size={18} className="login-field-icon" />
                <input 
                  type="email" 
                  className="login-input" 
                  placeholder="Email" 
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  required 
                />
              </div>
            )}

            {/* Password Input */}
            <div className="login-field-wrapper">
              <KeyRound size={18} className="login-field-icon" />
              <input 
                type="password" 
                className="login-input" 
                placeholder="Password (min 6 chars)" 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
                required 
                minLength={6} 
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                style={{ 
                  color: '#EF4444', 
                  fontSize: 13, 
                  fontWeight: 700, 
                  textAlign: 'center', 
                  padding: '10px 14px', 
                  background: '#FEE2E2', 
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)' 
                }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="login-submit-btn" 
              disabled={loading}
            >
              {loading ? '⏳ Connecting...' : (isLogin ? '🔑 Login' : '📝 Create Account')}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="login-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            style={{ marginLeft: 6 }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
