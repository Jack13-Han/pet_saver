import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import Lottie from "lottie-react"
import petAnimation from "../assets/lottie/pet.json"

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
      <motion.div className="login-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
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
          <motion.form key={isLogin ? 'login' : 'register'} className="login-form" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} onSubmit={handleSubmit}>
            <input type="text" className="login-input" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required minLength={3} />
            {!isLogin && <input type="email" className="login-input" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />}
            <input type="password" className="login-input" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#EF4444', fontSize: 14, fontWeight: 600, textAlign: 'center', padding: '8px 12px', background: '#FEE2E2', borderRadius: '8px' }}>
                ⚠️ {error}
              </motion.div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Connecting...' : (isLogin ? '🔑 Login' : '📝 Create Account')}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="login-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError('') }}>{isLogin ? 'Sign Up' : 'Login'}</button>
        </div>

        <div style={{ marginTop: 20, padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 1.6 }}>
          <strong>Setup Check:</strong><br />
          1. Import database/schema.sql to MySQL<br />
          2. Copy api/.env.example → api/.env<br />
          3. Set DB_PASS in api/.env<br />
          4. Place api/ in web server (htdocs/)<br />
          5. Enable mod_rewrite in Apache
        </div>
      </motion.div>
    </div>
  )
}
