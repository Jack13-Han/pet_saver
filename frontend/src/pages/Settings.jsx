import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, LogOut, Save, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../i18n.jsx'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()
  const { language, setLanguage, languages } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' })
  const [privacy, setPrivacy] = useState({
    public_profile: Boolean(Number(user?.public_profile ?? 0)),
    show_on_leaderboard: Boolean(Number(user?.show_on_leaderboard ?? 1)),
    share_achievements: true,
  })
  const [saving, setSaving] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.dataset.theme = 'dark'
      localStorage.setItem('theme', 'dark')
    } else {
      delete document.documentElement.dataset.theme
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    setForm({ username: user?.username || '', email: user?.email || '' })
    setPrivacy(prev => ({
      ...prev,
      public_profile: Boolean(Number(user?.public_profile ?? 0)),
      show_on_leaderboard: Boolean(Number(user?.show_on_leaderboard ?? 1)),
    }))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser(form)
      alert('Settings saved!')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updatePrivacy = async (key, value) => {
    const previous = privacy
    const next = { ...privacy, [key]: value }
    setPrivacy(next)

    try {
      if (key !== 'share_achievements') {
        await updateUser({ [key]: value ? 1 : 0 })
      }
    } catch (err) {
      console.error(err)
      setPrivacy(previous)
      alert(err.message || 'Failed to save privacy setting')
    }
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
                  { key: 'public_profile', label: 'Public Profile', desc: 'Allow others to see your stats' },
                  { key: 'show_on_leaderboard', label: 'Show on Leaderboard', desc: 'Appear in global rankings' },
                  { key: 'share_achievements', label: 'Share Achievements', desc: 'Let friends see your badges' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{item.desc}</div>
                    </div>
                    <ToggleSwitch checked={privacy[item.key]} onChange={(checked) => updatePrivacy(item.key, checked)} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Dark Mode</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Switch to dark theme</div>
                </div>
                <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Language</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Choose app language</div>
                </div>
                <select
                  className="form-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: 220 }}
                >
                  {languages.map(item => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
              {[
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

function ToggleSwitch({ defaultChecked, checked: controlledChecked, onChange }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const checked = controlledChecked ?? internalChecked

  const toggle = () => {
    const nextChecked = !checked
    if (onChange) {
      onChange(nextChecked)
    } else {
      setInternalChecked(nextChecked)
    }
  }

  return (
    <button onClick={toggle}
      type="button"
      aria-pressed={checked}
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
