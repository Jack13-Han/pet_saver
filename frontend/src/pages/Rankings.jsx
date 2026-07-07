import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, User } from 'lucide-react'
import { rankings as rankApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const rankIcons = { Bronze: 'B', Silver: 'S', Gold: 'G', Diamond: 'D', Platinum: 'P' }
const rankColors = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Diamond: '#B9F2FF', Platinum: '#E5E4E2' }

export default function Rankings() {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  if (user?.isGuest) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        minHeight: "70vh"
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: "var(--text-primary)" }}>
          Account Required / အကောင့်လိုအပ်ပါသည်
        </h2>
        <p style={{ maxWidth: 480, color: "var(--text-secondary)", marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
          This feature (Goals, Pets, Shop, achievements, and statistics) requires a registered account. Sign up or log in to start saving and playing with your pet!
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.reload();
          }}
          className="btn btn-primary"
          style={{ padding: "12px 28px", fontSize: 15, fontWeight: 700 }}
        >
          Sign Up / Login
        </button>
      </div>
    );
  }

  const podiumEntries = [
    rankings[1] && { user: rankings[1], position: 2, height: 140 },
    rankings[0] && { user: rankings[0], position: 1, height: 180 },
    rankings[2] && { user: rankings[2], position: 3, height: 120 },
  ].filter(Boolean)

  useEffect(() => { loadRankings() }, [])

  const loadRankings = async () => {
    try {
      const res = await rankApi.list()
      setRankings(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getProfileImage = (rankedUser) => (
    rankedUser.id === user?.id
      ? (user?.profile_image || rankedUser.profile_image)
      : rankedUser.profile_image
  )

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Leaderboard</h2>
          <p>Compete with other savers and climb the ranks!</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, marginBottom: 32, minHeight: 200 }}>
        {podiumEntries.map(({ user: r, position, height }, i) => {
          const isCurrentUser = user?.id === r.id
          const profileImage = getProfileImage(r)

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              <div
                className="ranking-podium-avatar"
                style={{
                  background: rankColors[r.rank] || '#ddd',
                  borderColor: isCurrentUser ? 'var(--accent-orange)' : 'white',
                }}
              >
                {profileImage ? (
                  <img src={profileImage} alt={`${r.username} profile`} />
                ) : (
                  <User size={28} />
                )}
              </div>
              <div style={{ padding: '8px 16px', background: position === 1 ? 'var(--accent-yellow-light)' : 'white', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-sm)' }}>
                {r.username}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                style={{ width: 100, background: position === 1 ? 'var(--accent-yellow)' : position === 2 ? '#C0C0C0' : '#CD7F32', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 24 }}
              >
                {position}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      <div className="rankings-list">
        {rankings.map((r, i) => {
          const isCurrentUser = user?.id === r.id
          const position = i + 1
          const profileImage = getProfileImage(r)

          return (
            <motion.div
              key={r.id}
              className={`ranking-item ${isCurrentUser ? 'current-user' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`ranking-position ${position <= 3 ? (position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze') : 'other'}`}>{position}</div>
              <div className="ranking-profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt={`${r.username} profile`} />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="ranking-user">
                <div className="ranking-username">
                  {r.username}
                  <span className={`ranking-rank-badge ${r.rank}`}>{r.rank}</span>
                  {isCurrentUser && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--accent-orange)' }}>You</span>}
                </div>
                <div className="ranking-stats">
                  <span><Trophy size={14} /> {r.total_targets_completed} goals</span>
                  <span><TrendingUp size={14} /> ¥{parseInt(r.total_saved).toLocaleString()} saved</span>
                  <span>{r.coins} coins</span>
                </div>
              </div>
              <div className="ranking-rank-icon">{rankIcons[r.rank] || 'T'}</div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
