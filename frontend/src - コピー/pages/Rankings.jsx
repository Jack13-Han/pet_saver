import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Medal, Crown, Trophy, TrendingUp } from 'lucide-react'
import { rankings as rankApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const rankIcons = { 'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Diamond': '💎', 'Platinum': '👑' }
const rankColors = { 'Bronze': '#CD7F32', 'Silver': '#C0C0C0', 'Gold': '#FFD700', 'Diamond': '#B9F2FF', 'Platinum': '#E5E4E2' }

export default function Rankings() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => { loadRankings() }, [])

  const loadRankings = async () => {
    try { const res = await rankApi.list(); setRankings(res.data || []) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Leaderboard 🏆</h2>
          <p>Compete with other savers and climb the ranks!</p>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 32, minHeight: 200 }}>
        {rankings.slice(0, 3).map((r, i) => {
          const heights = [140, 180, 120]
          const positions = [2, 1, 3]
          const position = positions[i]
          const height = heights[i]
          const isCurrentUser = user?.id === r.id
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2, duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: rankColors[r.rank] || '#ddd',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                border: `4px solid ${isCurrentUser ? 'var(--accent-orange)' : 'white'}`, boxShadow: 'var(--shadow-lg)'
              }}>{rankIcons[r.rank] || '🏅'}</div>
              <div style={{ padding: '8px 16px', background: position === 1 ? 'var(--accent-yellow-light)' : 'white', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-sm)' }}>
                {r.username}
              </div>
              <motion.div initial={{ height: 0 }} animate={{ height }} transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                style={{ width: 100, background: position === 1 ? 'var(--accent-yellow)' : position === 2 ? '#C0C0C0' : '#CD7F32', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24 }}>
                {position}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* RANKINGS LIST */}
      <div className="rankings-list">
        {rankings.map((r, i) => {
          const isCurrentUser = user?.id === r.id
          const position = i + 1
          return (
            <motion.div key={r.id} className={`ranking-item ${isCurrentUser ? 'current-user' : ''}`}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`ranking-position ${position <= 3 ? (position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze') : 'other'}`}>{position}</div>
              <div className="ranking-user">
                <div className="ranking-username">
                  {r.username}
                  <span className={`ranking-rank-badge ${r.rank}`}>{r.rank}</span>
                  {isCurrentUser && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--accent-orange)' }}>You</span>}
                </div>
                <div className="ranking-stats">
                  <span><Trophy size={14} /> {r.total_targets_completed} goals</span>
                  <span><TrendingUp size={14} /> ¥{parseInt(r.total_saved).toLocaleString()} saved</span>
                  <span>🪙 {r.coins} coins</span>
                </div>
              </div>
              <div style={{ fontSize: 24 }}>{rankIcons[r.rank] || '🏅'}</div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
