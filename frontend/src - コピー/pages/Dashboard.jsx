import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, ChevronRight, ChevronLeft, Lightbulb, Flame } from 'lucide-react'
import { dashboard as dashboardApi, transactions as txApi, avatars as avatarApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const avatarEmojis = { dog: '🐕', cat: '🐈', tree: '🌳', bird: '🐦', rabbit: '🐇' }
const moodEmojis = { happy: '😊', neutral: '😐', sad: '😢', dirty: '😷', celebrating: '🥳' }

const careActions = [
  { id: 'play', icon: '🎾', title: 'Play', effect: '+10 Happiness' },
  { id: 'feed', icon: '🍖', title: 'Feed', effect: '+10 Fullness' },
  { id: 'rest', icon: '🛏️', title: 'Rest', effect: '+10 Energy' },
  { id: 'shower', icon: '🚿', title: 'Shower', effect: '+5 Happiness' },
]

const quickAmounts = [100, 500, 1000, 5000, 10000]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [toast, setToast] = useState(null)
  const [animatingPet, setAnimatingPet] = useState(false)
  const { updateUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const res = await dashboardApi.get()
      setData(res.data)
      setLoading(false)
    } catch (err) {
      showToast('Failed to load dashboard', 'error')
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleTransaction = async (type) => {
    if (!amount || !data?.activeTarget) return
    const numAmount = parseFloat(amount)
    if (numAmount <= 0) return

    try {
      const res = await txApi.create({
        target_id: data.activeTarget.id,
        amount: numAmount,
        type,
        note: type === 'deposit' ? 'Daily savings' : 'Expense deduction',
        date: new Date().toISOString().split('T')[0]
      })

      setAnimatingPet(true)
      setTimeout(() => setAnimatingPet(false), 1000)

      showToast(type === 'deposit' ? `Saved ¥${numAmount.toLocaleString()}! 🎉` : `Deducted ¥${numAmount.toLocaleString()}`)

      setData(prev => ({
        ...prev,
        activeTarget: {
          ...prev.activeTarget,
          current_amount: res.data.new_amount,
          progress: res.data.progress,
          status: res.data.status,
          mood: res.data.mood,
          happiness: type === 'deposit' ? Math.min(100, prev.activeTarget.happiness + 5) : Math.max(0, prev.activeTarget.happiness - 5)
        }
      }))

      if (res.data.status === 'completed') {
        showToast('🎉 Goal completed! You earned coins!')
        updateUser({ coins: (prev => prev + Math.floor(data.activeTarget.target_amount / 100)) })
      }

      setAmount('')
      setSelectedAmount(null)
      loadDashboard()
    } catch (err) {
      showToast(err.message || 'Transaction failed', 'error')
    }
  }

  const handleCare = async (action) => {
    if (!data?.activeTarget) return
    try {
      await avatarApi.care({ target_id: data.activeTarget.id, action: action.id })
      showToast(`${action.title} completed! ✨`)
      loadDashboard()
    } catch (err) {
      showToast('Care action failed', 'error')
    }
  }

  const handleAmountSelect = (val) => {
    setSelectedAmount(val)
    setAmount(val.toString())
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  const target = data?.activeTarget
  const progress = target?.progress || 0

  return (
    <div className="animate-fade-in">
      <AnimatePresence>
        {toast && (
          <motion.div className={`toast ${toast.type}`} initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header">
        <div className="page-title">
          <h2>Hello, Saver! 👋</h2>
          <p>Take care of your pet and reach your goals!</p>
        </div>
        <div className="header-actions">
          <div className="streak-badge">
            <Flame size={20} />
            <span>{data?.user?.streak_days || 0} Day Streak</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* PET CARD */}
          {target ? (
            <motion.div className="pet-card" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
              <div className="pet-header">
                <div className="pet-info">
                  <div className="pet-avatar-img">{avatarEmojis[target.avatar_type] || '🐕'}</div>
                  <div className="pet-name">
                    <h3>{target.avatar_name} <Edit3 size={14} style={{ cursor: 'pointer', opacity: 0.5 }} /></h3>
                    <p>Happy {target.avatar_type.charAt(0).toUpperCase() + target.avatar_type.slice(1)} • Level {target.level}</p>
                  </div>
                </div>
                <div className={`pet-mood ${target.mood}`}>
                  <span>{moodEmojis[target.mood] || '😐'}</span>
                  <span>{target.mood.charAt(0).toUpperCase() + target.mood.slice(1)}</span>
                </div>
              </div>

              <div className="pet-scene">
                <motion.div className={`pet-character ${target.mood} ${animatingPet ? 'celebrating' : ''}`}
                  animate={animatingPet ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}>
                  {avatarEmojis[target.avatar_type] || '🐕'}
                </motion.div>
              </div>

              <div className="pet-stats">
                <div className="pet-stat">
                  <div className="pet-stat-icon happiness">😊</div>
                  <div className="pet-stat-bar"><div className="pet-stat-fill happiness" style={{ width: `${target.happiness}%` }} /></div>
                  <span className="pet-stat-value">{target.happiness}/100</span>
                </div>
                <div className="pet-stat">
                  <div className="pet-stat-icon energy">⚡</div>
                  <div className="pet-stat-bar"><div className="pet-stat-fill energy" style={{ width: `${target.energy}%` }} /></div>
                  <span className="pet-stat-value">{target.energy}/100</span>
                </div>
                <div className="pet-stat">
                  <div className="pet-stat-icon fullness">🥣</div>
                  <div className="pet-stat-bar"><div className="pet-stat-fill fullness" style={{ width: `${target.fullness}%` }} /></div>
                  <span className="pet-stat-value">{target.fullness}/100</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h3 style={{ marginBottom: 8 }}>No Active Goal</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Create your first savings goal to get a pet!</p>
              <button className="btn btn-primary" onClick={() => navigate('/goals')}>Create Goal</button>
            </div>
          )}

          {/* TRANSACTION INPUT */}
          {target && (
            <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>💰 Quick Save / Withdraw</h3>
              <div className="amount-scroll">
                {quickAmounts.map(val => (
                  <button key={val} className={`amount-chip ${selectedAmount === val ? 'active' : ''}`} onClick={() => handleAmountSelect(val)}>
                    ¥{val.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="transaction-input">
                <div className="amount-input-wrapper">
                  <span className="amount-prefix">¥</span>
                  <input type="number" className="amount-input" placeholder="Enter amount..." value={amount}
                    onChange={(e) => { setAmount(e.target.value); setSelectedAmount(null) }} />
                </div>
                <div className="tx-buttons">
                  <button className="tx-btn deposit" onClick={() => handleTransaction('deposit')} disabled={!amount}>
                    <ChevronRight size={18} /> Save
                  </button>
                  <button className="tx-btn withdraw" onClick={() => handleTransaction('withdrawal')} disabled={!amount}>
                    <ChevronLeft size={18} /> Use
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* CARE ACTIONS */}
          {target && (
            <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="card-header">
                <h3 className="card-title">Take Care of {target.avatar_name}</h3>
              </div>
              <div className="care-grid">
                {careActions.map(action => (
                  <motion.button key={action.id} className="care-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleCare(action)}>
                    <span className="care-btn-icon">{action.icon}</span>
                    <span className="care-btn-title">{action.title}</span>
                    <span className="care-btn-effect">{action.effect}</span>
                  </motion.button>
                ))}
              </div>
              <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                🗓️ Come back tomorrow for more activities!
              </p>
            </motion.div>
          )}

          {/* ACHIEVEMENTS */}
          <motion.div className="card" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="card-header">
              <h3 className="card-title">🏆 Achievements</h3>
              <button className="card-action" onClick={() => navigate('/achievements')}>View All</button>
            </div>
            <div className="achievement-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {data?.achievements?.slice(0, 4).map(ach => (
                <div key={ach.id} className={`achievement-card ${ach.is_unlocked ? 'unlocked' : ''}`}>
                  <div className={`achievement-icon ${ach.tier}`}>{ach.is_unlocked ? '✅' : '🔒'}</div>
                  <div className="achievement-info">
                    <div className="achievement-title">{ach.title}</div>
                    <div className="achievement-desc">{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="dashboard-side">
          {/* CURRENT GOAL */}
          {target && (
            <motion.div className="goal-card" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="card-header">
                <h3 className="card-title">Current Goal</h3>
                <button className="card-action" onClick={() => navigate('/goals')}>Edit Goal</button>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div className="goal-image">🎮</div>
                <div className="goal-info">
                  <h4>{target.name}</h4>
                  <div className="goal-amount">¥ {parseInt(target.target_amount).toLocaleString()}</div>
                </div>
              </div>
              <div className="goal-progress-section">
                <div className="goal-progress-bar">
                  <motion.div className="goal-progress-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, progress)}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                </div>
                <div className="goal-meta">
                  <span>Saved: ¥{parseInt(target.current_amount).toLocaleString()} / ¥{parseInt(target.target_amount).toLocaleString()}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                {target.deadline && (
                  <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                    ⏰ {Math.max(0, Math.ceil((new Date(target.deadline) - new Date()) / 86400000))} days left
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PET STATUS */}
          {target && (
            <motion.div className="card" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3 className="card-title" style={{ marginBottom: 16 }}>Pet Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['happiness', 'energy', 'fullness'].map(stat => (
                  <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{stat === 'happiness' ? '😊' : stat === 'energy' ? '⚡' : '🥣'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{stat}</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-secondary)' }}>{target[stat]} / 100</span>
                      </div>
                      <div className="goal-progress-bar" style={{ height: 8 }}>
                        <div className="goal-progress-fill" style={{
                          width: `${target[stat]}%`,
                          background: stat === 'happiness' ? 'var(--accent-green)' : stat === 'energy' ? 'var(--accent-yellow)' : 'var(--accent-blue)'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TIP */}
          <motion.div className="card" style={{ background: 'var(--accent-yellow-light)', borderColor: '#FEF08A' }} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Lightbulb size={24} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Tip: Keep your pet happy by saving money and completing challenges!
              </p>
            </div>
          </motion.div>

          {/* SHOP PREVIEW */}
          <motion.div className="card" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="card-header">
              <h3 className="card-title">Shop</h3>
              <button className="card-action" onClick={() => navigate('/shop')}>View All</button>
            </div>
            <div className="shop-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {data?.shopPreview?.map(item => (
                <div key={item.id} className="shop-item">
                  <span className="shop-item-icon">{item.icon}</span>
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">🪙 {item.price}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: 12, background: 'var(--accent-yellow-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                🪙 Earn coins by saving and completing challenges!
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
