import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Palette, LogOut, Save, Camera, Trash2 } from 'lucide-react'
import { user as userApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../i18n.jsx'

export default function Settings() {
  const { user, logout, updateUser } = useAuth()

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

  const { language, setLanguage, languages } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    profile_image: user?.profile_image || '',
    bio: user?.bio || '',
  })
  const [privacy, setPrivacy] = useState({
    public_profile: Boolean(Number(user?.public_profile ?? 0)),
    show_on_leaderboard: Boolean(Number(user?.show_on_leaderboard ?? 1)),
    share_achievements: true,
  })
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  })
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const profileInputRef = useRef(null)

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
    setForm({
      username: user?.username || '',
      email: user?.email || '',
      profile_image: user?.profile_image || '',
      bio: user?.bio || '',
    })
    setPrivacy(prev => ({
      ...prev,
      public_profile: Boolean(Number(user?.public_profile ?? 0)),
      show_on_leaderboard: Boolean(Number(user?.show_on_leaderboard ?? 1)),
    }))
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser({
        ...form,
        bio: form.bio.trim(),
      })
      alert('Settings saved!')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSize = 512
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * ratio))
        canvas.height = Math.max(1, Math.round(image.height * ratio))
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        setForm(prev => ({ ...prev, profile_image: canvas.toDataURL('image/jpeg', 0.86) }))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
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

  const handlePasswordChange = async (event) => {
    event.preventDefault()

    if (passwordForm.new_password.length < 6) {
      alert('New password must be at least 6 characters')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('New passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      await userApi.changePassword({
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ new_password: '', confirm_password: '' })
      setShowPasswordForm(false)
      alert('Password changed!')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
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
        </nav>

        <motion.div className="settings-content" key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'profile' && (
            <div className="card settings-panel">
              <h3 className="settings-panel-title">Profile Information</h3>
              <div className="settings-profile-summary">
                <div className="settings-profile-avatar">
                  {form.profile_image ? (
                    <img src={form.profile_image} alt="Profile" className="settings-profile-avatar-img" />
                  ) : (
                    <User size={34} />
                  )}
                  <button
                    type="button"
                    className="settings-profile-edit"
                    onClick={() => profileInputRef.current?.click()}
                    aria-label="Edit profile photo"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div className="settings-profile-copy">
                  <div className="settings-profile-name">{user?.username}</div>
                  <div className="settings-profile-email">{user?.email}</div>
                  {form.bio && <div className="settings-profile-bio">{form.bio}</div>}
                  <div style={{ marginTop: 4 }}>
                    <span className={`ranking-rank-badge ${user?.rank}`}>{user?.rank}</span>
                  </div>
                </div>
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="settings-profile-file"
                onChange={handleProfileImageChange}
              />
              <div className="settings-form">
                <div className="settings-profile-photo-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => profileInputRef.current?.click()}
                  >
                    <Camera size={18} /> Edit Profile Photo
                  </button>
                  {form.profile_image && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setForm(prev => ({ ...prev, profile_image: '' }))}
                    >
                      <Trash2 size={18} /> Remove
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    className="form-input settings-bio-input"
                    value={form.bio}
                    maxLength={280}
                    onChange={e => setForm({...form, bio: e.target.value})}
                    placeholder="Write a short profile bio"
                  />
                  <div className="settings-bio-count">{form.bio.length}/280</div>
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
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowPasswordForm(prev => !prev)}
                  >
                    <Shield size={18} /> Change Password
                  </button>
                </div>
                {showPasswordForm && (
                  <form className="settings-password-form" onSubmit={handlePasswordChange}>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        className="form-input"
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="settings-password-actions">
                      <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                        <Save size={18} /> {savingPassword ? 'Saving...' : 'Save Password'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={savingPassword}
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordForm({ new_password: '', confirm_password: '' })
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
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
