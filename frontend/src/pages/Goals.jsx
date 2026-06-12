import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Target } from 'lucide-react'
import { targets as targetApi } from '../api.js'

const avatarTypes = [
  { id: 'dog', emoji: '🐕', name: 'Dog' },
  { id: 'cat', emoji: '🐈', name: 'Cat' },
  { id: 'tree', emoji: '🌳', name: 'Tree' },
  { id: 'bird', emoji: '🐦', name: 'Bird' },
  { id: 'rabbit', emoji: '🐇', name: 'Rabbit' },
]

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', description: '', target_amount: '', category: 'General',
    deadline: '', avatar_type: 'dog', avatar_name: 'Mochi'
  })

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    try {
      const res = await targetApi.list('active')
      setGoals(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await targetApi.create({ ...form, target_amount: parseFloat(form.target_amount) })
      setShowModal(false)
      setForm({ name: '', description: '', target_amount: '', category: 'General', deadline: '', avatar_type: 'dog', avatar_name: 'Mochi' })
      loadGoals()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return
    try { await targetApi.delete(id); loadGoals() }
    catch (err) { alert(err.message) }
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>My Goals 🎯</h2>
          <p>Set targets and watch your pet grow!</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Goal
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        <AnimatePresence>
          {goals.map(goal => (
            <motion.div key={goal.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} layout>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 40 }}>{avatarTypes.find(a => a.id === goal.avatar_type)?.emoji || '🐕'}</div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: 18 }}>{goal.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{goal.avatar_name} • {goal.category}</p>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleDelete(goal.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="goal-progress-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>¥{parseInt(goal.current_amount).toLocaleString()}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>of ¥{parseInt(goal.target_amount).toLocaleString()}</span>
                </div>
                <div className="goal-progress-bar">
                  <motion.div className="goal-progress-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, goal.progress)}%` }} transition={{ duration: 1 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <span>{Math.round(goal.progress)}% Complete</span>
                  {goal.deadline && <span>⏰ {Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / 86400000))} days left</span>}
                </div>
              </div>
              <div style={{ marginTop: 12, padding: 10, background: 'var(--accent-orange-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-orange)' }}>
                  {goal.progress >= 100 ? '🎉 Goal Completed!' : goal.mood === 'happy' ? '😊 Your pet is happy!' : goal.mood === 'sad' ? '😢 Pet needs more savings!' : '😐 Keep saving!'}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No goals yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Create your first savings goal to get started!</p>
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Create New Goal</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label>Goal Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. New Nintendo Switch" required />
                </div>
                <div className="form-group">
                  <label>Target Amount (¥)</label>
                  <input className="form-input" type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} placeholder="35000" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option>General</option><option>Education</option><option>Electronics</option><option>Travel</option><option>Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline (Optional)</label>
                  <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Choose Avatar</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {avatarTypes.map(type => (
                      <button key={type.id} type="button" onClick={() => setForm({...form, avatar_type: type.id})}
                        style={{
                          padding: 12, borderRadius: 'var(--radius-md)',
                          border: form.avatar_type === type.id ? '3px solid var(--accent-green)' : '2px solid var(--border-color)',
                          background: form.avatar_type === type.id ? 'var(--accent-green-light)' : 'white',
                          cursor: 'pointer', fontSize: 28, transition: 'all 0.2s'
                        }}>
                        {type.emoji}
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Avatar Name</label>
                  <input className="form-input" value={form.avatar_name} onChange={e => setForm({...form, avatar_name: e.target.value})} placeholder="Mochi" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Create Goal</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
