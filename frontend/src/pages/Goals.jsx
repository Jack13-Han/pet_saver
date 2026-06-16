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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-0" onClick={() => setShowModal(false)}>
            <motion.div 
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-orange-100"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-400 to-orange-500 p-6 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-1 flex items-center gap-2 tracking-tight">
                    <Target className="w-7 h-7" /> Create New Goal
                  </h3>
                  <p className="text-orange-100 text-sm font-medium">Set a target and watch your pet grow!</p>
                </div>
                <button 
                  className="relative z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-white" 
                  onClick={() => setShowModal(false)}
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              {/* Form Body */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-8 custom-scrollbar">
                <form id="createGoalForm" onSubmit={handleCreate} className="space-y-8">
                  
                  {/* Goal Basics */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">What are you saving for? ✨</label>
                      <input 
                        className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-100 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all outline-none text-gray-800 font-bold placeholder:font-normal placeholder:text-gray-400" 
                        value={form.name} 
                        onChange={e => setForm({...form, name: e.target.value})} 
                        placeholder="e.g. New Nintendo Switch" 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Amount 💰</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 font-black text-lg">¥</span>
                          <input 
                            className="w-full pl-10 pr-5 py-3.5 rounded-2xl border-2 border-orange-100 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all outline-none text-gray-800 font-black text-lg" 
                            type="number" 
                            value={form.target_amount} 
                            onChange={e => setForm({...form, target_amount: e.target.value})} 
                            placeholder="35000" 
                            min="1"
                            required 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Category 📁</label>
                        <select 
                          className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-100 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all outline-none text-gray-800 font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23fb923c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1.2rem_center] bg-[length:0.8rem_auto]" 
                          value={form.category} 
                          onChange={e => setForm({...form, category: e.target.value})}
                        >
                          <option>General</option><option>Education</option><option>Electronics</option><option>Travel</option><option>Emergency</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Deadline ⏰ (Optional)</label>
                      <input 
                        className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-100 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all outline-none text-gray-800 font-bold" 
                        type="date" 
                        value={form.deadline} 
                        onChange={e => setForm({...form, deadline: e.target.value})} 
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Pet Selection */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Choose Your Companion 🐾</label>
                      <div className="grid grid-cols-5 gap-3">
                        {avatarTypes.map(type => (
                          <button 
                            key={type.id} 
                            type="button" 
                            onClick={() => setForm({...form, avatar_type: type.id})}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                              form.avatar_type === type.id 
                                ? 'border-orange-400 bg-orange-50 shadow-md scale-105' 
                                : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/50'
                            }`}
                          >
                            <span className="text-3xl mb-1 filter drop-shadow-sm">{type.emoji}</span>
                            <span className={`text-xs font-bold ${form.avatar_type === type.id ? 'text-orange-600' : 'text-gray-500'}`}>
                              {type.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Pet's Name 🏷️</label>
                      <input 
                        className="w-full px-5 py-3.5 rounded-2xl border-2 border-orange-100 bg-orange-50/30 focus:bg-white focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20 transition-all outline-none text-gray-800 font-bold placeholder:font-normal placeholder:text-gray-400" 
                        value={form.avatar_name} 
                        onChange={e => setForm({...form, avatar_name: e.target.value})} 
                        placeholder="e.g. Mochi" 
                      />
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50/80 shrink-0 flex justify-end gap-3 rounded-b-[2rem]">
                <button 
                  type="button" 
                  className="px-6 py-3.5 rounded-xl font-bold text-gray-600 bg-white border-2 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="createGoalForm"
                  className="px-8 py-3.5 rounded-xl font-black text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all active:scale-95"
                >
                  Create Goal ✨
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
