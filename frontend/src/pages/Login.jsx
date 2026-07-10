import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { auth as authApi } from '../api.js'
import Lottie from 'lottie-react'
import petAnimation from '../assets/lottie/pet.json'
import { User, Mail, KeyRound } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, loginAsGuest } = useAuth()

  const isLogin = mode === 'login'
  const isRegister = mode === 'register'
  const isPasswordChange = mode === 'changePassword'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (isPasswordChange && form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(form.username, form.password)
      } else if (isRegister) {
        await register(form.username, form.email, form.password)
      } else {
        await authApi.changePassword(form.username, form.password, form.newPassword)
        setForm(prev => ({ ...prev, password: '', newPassword: '', confirmPassword: '' }))
        setMode('login')
        setMessage('Password changed. Please login with your new password.')
      }
    } catch (err) {
      setError(err.message || 'Connection failed. Is PHP server running?')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
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
              loop
              style={{
                width: 140,
                height: 140,
              }}
            />
          </div>
          <h1>Pet Saver</h1>
          <p>Grow with your savings</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            className="login-form"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            onSubmit={handleSubmit}
          >
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
                autoComplete="username"
              />
            </div>

            {isRegister && (
              <div className="login-field-wrapper">
                <Mail size={18} className="login-field-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder="Email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            )}

            <div className="login-field-wrapper">
              <KeyRound size={18} className="login-field-icon" />
              <input
                type="password"
                className="login-input"
                placeholder={isPasswordChange ? 'Current Password' : 'Password (min 6 chars)'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {isPasswordChange && (
              <>
                <div className="login-field-wrapper">
                  <KeyRound size={18} className="login-field-icon" />
                  <input
                    type="password"
                    className="login-input"
                    placeholder="New Password (min 6 chars)"
                    value={form.newPassword}
                    onChange={e => setForm({ ...form, newPassword: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="login-field-wrapper">
                  <KeyRound size={18} className="login-field-icon" />
                  <input
                    type="password"
                    className="login-input"
                    placeholder="Confirm New Password"
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-error-message"
              >
                {error}
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-success-message"
              >
                {message}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Connecting...' : (isLogin ? 'Login' : isRegister ? 'Create Account' : 'Change Password')}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="login-toggle" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 16, marginBottom: 16 }}>
          <span>Try without an account? </span>
          <button
            type="button"
            onClick={loginAsGuest}
            style={{ marginLeft: 6, fontWeight: 'bold', color: '#10b981', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Continue as Guest
          </button>
        </div>

        <div className="login-toggle">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
            style={{ marginLeft: 6 }}
          >
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </div>
        <div className="login-toggle login-password-toggle">
          {isPasswordChange ? 'Back to ' : 'Need to update your password? '}
          <button
            type="button"
            onClick={() => switchMode(isPasswordChange ? 'login' : 'changePassword')}
            style={{ marginLeft: 6 }}
          >
            {isPasswordChange ? 'Login' : 'Change Password'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
