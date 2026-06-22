import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, LogOut, Save } from 'lucide-react'
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
    <div className="animate-fade-in settings-page">
      <div className="page-header">
        <div className="page-title">
          <h2>Settings ⚙️</h2>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}>
                <tab.icon size={18} /><span>{tab.label}</span>
              </button>
            ))}
          </div>
          <button onClick={logout} className="settings-logout">
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>

        <motion.div className="settings-content" key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' && (
            <div className="card settings-panel">
              <h3 className="settings-panel-title">Profile Information</h3>
              <div className="settings-profile-summary">
                <div className="settings-profile-avatar"><User size={34} /></div>
                <div className="settings-profile-copy">
                  <div className="settings-profile-name">{user?.username}</div>
                  <div className="settings-profile-email">{user?.email}</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`ranking-rank-badge ${user?.rank}`}>{user?.rank}</span>
                  </div>
                </div>
              </div>
              <div className="settings-form">
                <div className="form-group">
                  <label>Username</label>
                  <input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <button className="btn btn-primary settings-save" onClick={handleSave} disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card settings-panel">
              <h3 className="settings-panel-title">Notification Preferences</h3>
              <div className="settings-options">
                {[
                  { label: 'Daily Saving Reminder', desc: 'Get reminded to save every day', default: true },
                  { label: 'Goal Milestones', desc: 'Notify when you reach 25%, 50%, 75%', default: true },
                  { label: 'Streak Alerts', desc: 'Warn when streak is about to break', default: true },
                  { label: 'Achievement Unlocks', desc: 'Celebrate when you earn badges', default: true },
                  { label: 'Weekly Summary', desc: 'Weekly report of savings', default: false },
                ].map((item, i) => (
                  <div key={i} className="settings-option">
                    <div className="settings-option-copy">
                      <div className="settings-option-title">{item.label}</div>
                      <div className="settings-option-desc">{item.desc}</div>
                    </div>
                    <ToggleSwitch defaultChecked={item.default} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="card settings-panel">
              <h3 className="settings-panel-title">Privacy & Security</h3>
              <div className="settings-options">
                {[
                  { key: 'public_profile', label: 'Public Profile', desc: 'Allow others to see your stats' },
                  { key: 'show_on_leaderboard', label: 'Show on Leaderboard', desc: 'Appear in global rankings' },
                  { key: 'share_achievements', label: 'Share Achievements', desc: 'Let friends see your badges' },
                ].map((item, i) => (
                  <div key={i} className="settings-option">
                    <div className="settings-option-copy">
                      <div className="settings-option-title">{item.label}</div>
                      <div className="settings-option-desc">{item.desc}</div>
                    </div>
                    <ToggleSwitch checked={privacy[item.key]} onChange={(checked) => updatePrivacy(item.key, checked)} />
                  </div>
                ))}
                <div className="settings-danger-action">
                  <button className="btn btn-danger"><Shield size={18} /> Change Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card settings-panel">
              <h3 className="settings-panel-title">Appearance</h3>
              <div className="settings-option">
                <div className="settings-option-copy">
                  <div className="settings-option-title">Dark Mode</div>
                  <div className="settings-option-desc">Switch to dark theme</div>
                </div>
                <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
              </div>
              <div className="settings-option settings-language-option">
                <div className="settings-option-copy">
                  <div className="settings-option-title">Language</div>
                  <div className="settings-option-desc">Choose app language</div>
                </div>
                <select
                  className="form-input"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{ width: 'min(220px, 100%)' }}
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
                <div key={i} className="settings-option">
                  <div className="settings-option-copy">
                    <div className="settings-option-title">{item.label}</div>
                    <div className="settings-option-desc">{item.desc}</div>
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
      className="settings-toggle"
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
