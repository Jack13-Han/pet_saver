import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Home, Target, Receipt, ShoppingBag, Trophy, Camera, Medal, Settings, LogOut, Flame, X, BarChart3, WalletCards } from 'lucide-react'

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

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

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
            <div className="coin-amount">{user?.coins?.toLocaleString() || 0}</div>
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

        <div className="motivation-box hidden sm:flex">
          <span>🌱</span>
          <p>Keep saving to help your pet grow!</p>
        </div>

        <button className="nav-item" onClick={logout} style={{ marginTop: 12 }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
