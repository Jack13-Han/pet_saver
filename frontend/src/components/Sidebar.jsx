import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { USER_SYNC_EVENT } from '../api.js'
import { Home, Target, Receipt, ShoppingBag, Trophy, Camera, Medal, Settings, Flame, X, BarChart3, WalletCards } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/transactions', icon: Receipt, label: 'Expenses' },
  { path: '/insights', icon: BarChart3, label: 'Insights' },
  { path: '/planner', icon: WalletCards, label: 'Planner' },
  { path: '/expense-analyst', icon: Flame, label: 'Expense Analyst' },
  { path: '/scanner', icon: Camera, label: 'Receipt Scanner' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/achievements', icon: Trophy, label: 'Achievements' },
  { path: '/rankings', icon: Medal, label: 'Rankings' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

function getStoredCoins() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const storedCoins = Number(storedUser?.coins)
    return Number.isFinite(storedCoins) ? storedCoins : 0
  } catch {
    return 0
  }
}

function CoinBalance() {
  const { user, refreshUser } = useAuth()
  const [coins, setCoins] = useState(() => {
    const authCoins = Number(user?.coins)
    return Number.isFinite(authCoins) ? authCoins : getStoredCoins()
  })

  useEffect(() => {
    const authCoins = Number(user?.coins)
    if (Number.isFinite(authCoins)) setCoins(authCoins)
  }, [user?.coins])

  useEffect(() => {
    const handleUserSync = (event) => {
      const nextCoins = Number(event.detail?.coins)
      if (Number.isFinite(nextCoins)) setCoins(nextCoins)
    }

    window.addEventListener(USER_SYNC_EVENT, handleUserSync)
    return () => window.removeEventListener(USER_SYNC_EVENT, handleUserSync)
  }, [])

  useEffect(() => {
    if (!user || !refreshUser) return undefined

    let cancelled = false
    const syncCoins = async () => {
      const freshUser = await refreshUser()
      const nextCoins = Number(freshUser?.coins)
      if (!cancelled && Number.isFinite(nextCoins)) setCoins(nextCoins)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncCoins()
    }

    syncCoins()
    const intervalId = window.setInterval(syncCoins, 1000)
    window.addEventListener('focus', syncCoins)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', syncCoins)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshUser, user?.id])

  return (
    <div className="coin-amount" data-no-translate>
      {coins.toLocaleString()}
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button 
        className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
        onClick={onClose}
      >
        <X size={20} />
      </button>

      <div className="sidebar-brand">
        <div className="brand-icon">🐾</div>
        <div className="brand-text">
          <h1>Pet Saver</h1>
          <p>Grow with your savings</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              navigate(item.path)
              if (onClose) onClose()
            }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-coins">
          <div className="coin-icon">🪙</div>
          <div>
            <CoinBalance />
            <div className="coin-label">Coins</div>
          </div>
        </div>

        <div className="user-level">
          <div className="level-header">
            <span className="level-text">Level {user?.rank || 'Bronze'}</span>
            <span className="level-exp">{user?.total_targets_completed || 0} goals</span>
          </div>
          <div className="level-bar">
            <div className="level-fill" style={{ width: `${Math.min(100, (user?.total_targets_completed || 0) * 10)}%` }} />
          </div>
        </div>

      </div>
    </aside>
  )
}
