import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, CheckCircle2, Lock } from 'lucide-react'
import { achievements as achApi } from '../api.js'

const tierColors = {
  bronze: { bg: '#FDE68A', text: '#92400E' },
  silver: { bg: '#E5E7EB', text: '#4B5563' },
  gold: { bg: '#FCD34D', text: '#92400E' },
  platinum: { bg: '#C4B5FD', text: '#5B21B6' }
}

export default function Achievements() {
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAchievements() }, [])

  const loadAchievements = async () => {
    try {
      const res = await achApi.list()
      setAchievements(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const unlocked = achievements.filter(a => a.is_unlocked)
  const locked = achievements.filter(a => !a.is_unlocked)

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Achievements 🏆</h2>
          <p>Complete challenges and earn rewards!</p>
        </div>
        <div className="streak-badge" style={{ background: 'var(--accent-yellow-light)', color: 'var(--accent-yellow)' }}>
          <Trophy size={20} />
          <span>{unlocked.length} / {achievements.length} Unlocked</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {['bronze', 'silver', 'gold', 'platinum'].map(tier => {
          const count = unlocked.filter(a => a.tier === tier).length
          const total = achievements.filter(a => a.tier === tier).length
          const colors = tierColors[tier]
          return (
            <div key={tier} className="card" style={{ textAlign: 'center', borderTop: `4px solid ${colors.bg}` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {tier === 'bronze' ? '🥉' : tier === 'silver' ? '🥈' : tier === 'gold' ? '🥇' : '💎'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 24, color: colors.text }}>{count}/{total}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tier}</div>
            </div>
          )
        })}
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>✨ Unlocked</h3>
      <div className="achievement-grid">
        {unlocked.map((ach, i) => (
          <motion.div key={ach.id} className="achievement-card unlocked" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <div className={`achievement-icon ${ach.tier}`} style={{ fontSize: 28 }}>
              {ach.icon === 'piggy-bank' ? '🐷' : ach.icon === 'calendar' ? '📅' : ach.icon === 'target' ? '🎯' : ach.icon === 'crown' ? '👑' : ach.icon === 'shopping-bag' ? '🛍️' : ach.icon === 'camera' ? '📷' : ach.icon === 'gem' ? '💎' : '🏆'}
            </div>
            <div className="achievement-info">
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>
                <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Unlocked {ach.unlocked_at && new Date(ach.unlocked_at).toLocaleDateString()}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {unlocked.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32, marginBottom: 24 }}>
          <Lock size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>No achievements unlocked yet. Start saving!</p>
        </div>
      )}

      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16, marginTop: 32 }}>🔒 In Progress</h3>
      <div className="achievement-grid">
        {locked.map((ach, i) => (
          <motion.div key={ach.id} className="achievement-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ opacity: 0.7 }}>
            <div className={`achievement-icon ${ach.tier}`} style={{ fontSize: 28, filter: 'grayscale(0.5)' }}><Lock size={24} /></div>
            <div className="achievement-info">
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              <div className="achievement-progress">
                <div className="achievement-progress-bar">
                  <div className="achievement-progress-fill" style={{ width: `${Math.min(100, (ach.progress / ach.max_progress) * 100)}%` }} />
                </div>
                <div className="achievement-progress-text">{ach.progress} / {ach.max_progress} ({Math.round((ach.progress / ach.max_progress) * 100)}%)</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
