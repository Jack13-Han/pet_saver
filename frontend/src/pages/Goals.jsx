import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Target, Pencil } from 'lucide-react'
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
  const [editingGoalId, setEditingGoalId] = useState(null)
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

  const handleEditClick = (goal) => {
    setForm({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      category: goal.category || 'General',
      deadline: goal.deadline || '',
      avatar_type: goal.avatar_type || 'dog',
      avatar_name: goal.avatar_name || 'Mochi'
    })
    setEditingGoalId(goal.id)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoalId(null)
    setForm({
      name: '', description: '', target_amount: '', category: 'General',
      deadline: '', avatar_type: 'dog', avatar_name: 'Mochi'
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editingGoalId) {
        await targetApi.update(editingGoalId, { ...form, target_amount: parseFloat(form.target_amount) })
      } else {
        await targetApi.create({ ...form, target_amount: parseFloat(form.target_amount) })
      }
      handleCloseModal()
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
        {goals.length === 0 ? (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Goal
          </button>
        ) : (
          <div style={{ background: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 'bold' }}>
            Complete current goal first!
          </div>
        )}
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
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleEditClick(goal)}>
                    <Pencil size={18} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleDelete(goal.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
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

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4 sm:p-0" onClick={handleCloseModal}>
            <motion.div 
              className="bg-white rounded-[28px] shadow-[0_28px_70px_rgba(15,23,42,0.18)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-slate-200 p-6 flex justify-between items-center bg-white shrink-0 relative overflow-hidden">
                <div className="relative z-10 flex-1 text-center">
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900 mb-1 flex items-center justify-center gap-2">
                    <Target className="w-6 h-6 text-emerald-500" /> {editingGoalId ? 'Edit Goal' : 'Create New Goal'}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">{editingGoalId ? 'Update your target and pet details!' : 'Set a target and watch your pet grow!'}</p>
                </div>
                <button 
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none" 
                  onClick={handleCloseModal}
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Form Body */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-8 custom-scrollbar">
                <form id="createGoalForm" onSubmit={handleSave} className="space-y-6">
                  
                  {/* Goal Basics */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 block">What are you saving for? ✨</label>
                      <input 
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400" 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        placeholder="e.g. New Nintendo Switch" 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 block">Target Amount 💰</label>
                        <div className="relative flex items-center border-b-2 border-emerald-500 pb-2">
                          <span className="text-xl font-bold text-slate-400 mr-2">¥</span>
                          <input 
                            className="w-full border-0 bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:text-slate-400" 
                            type="number" 
                            value={form.target_amount} 
                            onChange={e => setForm({...form, target_amount: e.target.value})} 
                            placeholder="35000" 
                            min="1"
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 block">Category 📁</label>
                        <select 
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-slate-900 font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2310b981%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.8rem_auto]" 
                          value={form.category} 
                          onChange={e => setForm({...form, category: e.target.value})}
                        >
                          <option>General</option><option>Education</option><option>Electronics</option><option>Travel</option><option>Emergency</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 block">Deadline ⏰ (Optional)</label>
                      <input 
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-slate-900 font-bold" 
                        type="date" 
                        value={form.deadline} 
                        onChange={e => setForm({...form, deadline: e.target.value})} 
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Pet Selection */}
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-500 block">Choose Your Companion 🐾</label>
                      <div className="grid grid-cols-5 gap-3">
                        {avatarTypes.map(type => (
                          <button 
                            key={type.id} 
                            type="button" 
                            onClick={() => setForm({...form, avatar_type: type.id})}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                              form.avatar_type === type.id 
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm scale-105' 
                                : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                            }`}
                          >
                            <span className="text-3xl mb-1 filter drop-shadow-sm">{type.emoji}</span>
                            <span className={`text-xs font-bold ${form.avatar_type === type.id ? 'text-emerald-700' : 'text-slate-500'}`}>
                              {type.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 block">Pet's Name 🏷️</label>
                      <input 
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400" 
                        value={form.avatar_name} 
                        onChange={e => setForm({...form, avatar_name: e.target.value})} 
                        placeholder="e.g. Mochi" 
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-3 rounded-b-[28px]">
                <button 
                  type="button" 
                  className="px-6 py-3.5 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="createGoalForm"
                  className="px-8 py-3.5 rounded-2xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_8px_16px_rgba(74,222,128,0.25)] transition-all active:scale-95"
                >
                  {editingGoalId ? 'Save Changes ✨' : 'Create Goal ✨'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
