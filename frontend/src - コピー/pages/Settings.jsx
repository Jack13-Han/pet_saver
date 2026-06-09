import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, LogOut, Save, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    updateUser(form)
    setTimeout(() => { setSaving(false); alert('Settings saved!') }, 500)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Settings ⚙️</h2>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 16, height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  border: 'none', background: activeTab === tab.id ? 'var(--accent-green-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-green)' : 'var(--text-secondary)',
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', fontSize: 15
                }}>
                <tab.icon size={18} /><span>{tab.label}</span>
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
            <button onClick={logout}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: 'none', background: '#FEE2E2', color: '#EF4444', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 15
              }}>
              <LogOut size={18} /><span>Logout</span>
            </button>
          </div>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Profile Information</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-orange-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{user?.username}</div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{user?.email}</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`ranking-rank-badge ${user?.rank}`}>{user?.rank}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Username</label>
                  <input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={handleSave} disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Notification Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Daily Saving Reminder', desc: 'Get reminded to save every day', default: true },
                  { label: 'Goal Milestones', desc: 'Notify when you reach 25%, 50%, 75%', default: true },
                  { label: 'Streak Alerts', desc: 'Warn when streak is about to break', default: true },
                  { label: 'Achievement Unlocks', desc: 'Celebrate when you earn badges', default: true },
                  { label: 'Weekly Summary', desc: 'Weekly report of savings', default: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch defaultChecked={item.default} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="card">
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Privacy & Security</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Public Profile', desc: 'Allow others to see your stats', default: false },
                  { label: 'Show on Leaderboard', desc: 'Appear in global rankings', default: true },
                  { label: 'Share Achievements', desc: 'Let friends see your badges', default: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch defaultChecked={item.default} />
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-danger"><Shield size={18} /> Change Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>Appearance</h3>
              {[
                { label: 'Dark Mode', desc: 'Switch to dark theme' },
                { label: 'Compact View', desc: 'Show more items per page' },
                { label: 'Animations', desc: 'Enable smooth animations', default: true },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.desc}</div>
                  </div>
                  <ToggleSwitch defaultChecked={item.default ?? false} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function ToggleSwitch({ defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button onClick={() => setChecked(!checked)}
      style={{
        width: 48, height: 26, borderRadius: 13, border: 'none',
        background: checked ? 'var(--accent-green)' : 'var(--border-color)',
        position: 'relative', cursor: 'pointer', transition: 'all 0.3s', padding: 0
      }}>
      <motion.div animate={{ x: checked ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}
