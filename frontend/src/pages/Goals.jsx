import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import { Check, ChevronDown, Plus, Trash2, Target, Pencil, Lock, X } from 'lucide-react'
import { shop as shopApi, targets as targetApi } from '../api.js'
import lePetitChatNoirAnimation from '../assets/lottie/le-petit-chat-noir.json'
import { avatarTypes } from '../petAssets.js'
import { useAuth } from '../context/AuthContext.jsx'

const goalCategoryOptions = ['General', 'Education', 'Electronics', 'Travel', 'Emergency']

const defaultGoalForm = {
  name: '',
  description: '',
  target_amount: '',
  category: 'General',
  deadline: '',
  avatar_type: 'dog',
  avatar_name: 'Mochi'
}

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])


  const [showModal, setShowModal] = useState(false)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [avatarShopItems, setAvatarShopItems] = useState([])
  const [customCategory, setCustomCategory] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [form, setForm] = useState(defaultGoalForm)

  useEffect(() => { loadGoals() }, [])

  const avatarShopMap = Object.fromEntries(
    avatarShopItems
      .filter(item => item.avatar_type)
      .map(item => [item.avatar_type, item])
  )

  const loadGoals = async () => {
    try {
      const [goalRes, shopRes] = await Promise.all([
        targetApi.list('all'),
        shopApi.list()
      ])
      setGoals(goalRes.data || [])
      setAvatarShopItems((shopRes.data || []).filter(item => item.category === 'avatar'))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleEditClick = (goal) => {
    const category = goal.category || 'General'
    const hasPresetCategory = goalCategoryOptions.includes(category)
    setCustomCategory(hasPresetCategory ? '' : category)
    setForm({
      name: goal.name,
      description: goal.description || '',
      target_amount: goal.target_amount.toString(),
      category: hasPresetCategory ? category : 'Custom',
      deadline: goal.deadline || '',
      avatar_type: goal.avatar_type || 'dog',
      avatar_name: goal.avatar_name || 'Mochi'
    })
    setEditingGoalId(goal.id)
    setShowCategoryPicker(false)
    setShowModal(true)
  }

  const handleCreateClick = () => {
    setEditingGoalId(null)
    setCustomCategory('')
    setShowCategoryPicker(false)
    setForm(defaultGoalForm)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoalId(null)
    setCustomCategory('')
    setShowCategoryPicker(false)
    setForm(defaultGoalForm)
  }

  const setGoalCategory = (category, options = {}) => {
    const { closePicker = true } = options
    setForm(previous => ({ ...previous, category }))
    if (category !== 'Custom') setCustomCategory('')
    if (closePicker) setShowCategoryPicker(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const category = form.category === 'Custom' ? customCategory.trim() : form.category
    if (!category) {
      alert('Enter a category name.')
      return
    }
    const selectedType = avatarTypes.find(type => type.id === form.avatar_type)
    if (selectedType && !isAvatarUnlocked(selectedType)) {
      alert('Buy this avatar in the shop first.')
      return
    }
    try {
      const finalForm = { ...form, category, target_amount: parseFloat(form.target_amount) }
      if (editingGoalId) {
        await targetApi.update(editingGoalId, finalForm)
      } else {
        await targetApi.create(finalForm)
      }
      handleCloseModal()
      setCustomCategory('')
      loadGoals()
    } catch (err) { alert(err.message) }
  }

  const isAvatarUnlocked = (type) => {
    if (!type.requiresPurchase) return true
    return Boolean(avatarShopMap[type.id]?.owned)
  }

  const regularGoals = goals.filter(goal => (
    goal.status === 'active' &&
    goal.category !== 'Emergency' &&
    !String(goal.name || '').toLowerCase().includes('emergency')
  ))

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await targetApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadGoals()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const selectedGoalCategoryLabel = form.category === 'Custom'
    ? customCategory.trim() || 'Custom'
    : form.category

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>My Goals 🎯</h2>
          <p>Set targets and watch your pet grow!</p>
        </div>
        {regularGoals.length === 0 ? (
          <button className="btn btn-primary" onClick={handleCreateClick}>
            <Plus size={18} /> New Goal
          </button>
        ) : (
          <div style={{ background: 'var(--accent-orange-light)', color: 'var(--accent-orange)', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: 'bold' }}>
            Complete current goal first!
          </div>
        )}
      </div>

      {/* ACTIVE GOALS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: completedGoals.length > 0 ? 40 : 0 }}>
        <AnimatePresence>
          {activeGoals.map(goal => (
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
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleEditClick(goal)} aria-label={`Edit ${goal.name}`}>
                    <Pencil size={18} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setDeleteTarget(goal)} aria-label={`Delete ${goal.name}`}>
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

      {activeGoals.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: completedGoals.length > 0 ? 40 : 0 }}>
          <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No active goals</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Create a savings goal to start your pet companion!</p>
        </div>
      )}

      {/* COMPLETED GOALS HISTORY SECTION */}
      {completedGoals.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 Completed Goals History
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            <AnimatePresence>
              {completedGoals.map(goal => (
                <motion.div key={goal.id} className="card" style={{ border: '1px solid #10b981', background: 'var(--bg-card)', opacity: 0.95 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} layout>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 40 }}>{avatarTypes.find(a => a.id === goal.avatar_type)?.emoji || '🐕'}</div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{goal.name}</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{goal.avatar_name} • {goal.category}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setDeleteTarget(goal)} aria-label={`Delete ${goal.name}`}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="goal-progress-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>¥{parseInt(goal.target_amount).toLocaleString()}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Target Met!</span>
                    </div>
                    <div className="goal-progress-bar" style={{ background: 'var(--accent-green-light)' }}>
                      <div className="goal-progress-fill" style={{ width: '100%', background: 'var(--accent-green)' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: 10, background: 'var(--accent-green-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green-dark)' }}>
                      🎉 Goal Successfully Reached!
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="modal-overlay goals-delete-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}>
            <motion.div className="delete-confirm-modal" initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }} onClick={e => e.stopPropagation()}>
              <div className="delete-confirm-gif">
                <Lottie animationData={lePetitChatNoirAnimation} loop className="delete-confirm-lottie" />
              </div>
              <div className="delete-confirm-box">
                <button className="modal-close delete-confirm-close" onClick={() => setDeleteTarget(null)} aria-label="Close">
                  <X size={18} />
                </button>
                <h3>Delete this goal?</h3>
                <p>{deleteTarget.name} will be removed with its savings history.</p>
                <div className="delete-confirm-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4 sm:p-0" onClick={handleCloseModal}>
            <motion.div 
              className="relative bg-white rounded-[28px] shadow-[0_28px_70px_rgba(15,23,42,0.18)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
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
                  type="button"
                  className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none"
                  onClick={e => {
                    e.stopPropagation()
                    handleCloseModal()
                  }}
                  aria-label="Close goal editor"
                >
                  <X className="w-5 h-5" />
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
                        <div className="goal-category-field">
                          <button
                            type="button"
                            className="goal-category-trigger"
                            onClick={() => setShowCategoryPicker(true)}
                            aria-haspopup="dialog"
                            aria-expanded={showCategoryPicker}
                          >
                            <span className="goal-category-trigger-value">{selectedGoalCategoryLabel}</span>
                            <ChevronDown size={18} aria-hidden="true" />
                          </button>
                          {form.category === 'Custom' && (
                            <input
                              className="quick-save-custom-category goal-category-custom"
                              value={customCategory}
                              onChange={e => setCustomCategory(e.target.value)}
                              placeholder="Write your own category"
                              maxLength={50}
                              required
                            />
                          )}
                        </div>
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
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {avatarTypes.map(type => {
                          const unlocked = isAvatarUnlocked(type)
                          const shopItem = avatarShopMap[type.id]
                          const isSelected = form.avatar_type === type.id
                          return (
                            <button 
                              key={type.id} 
                              type="button" 
                              onClick={() => unlocked && setForm({...form, avatar_type: type.id})}
                              disabled={!unlocked}
                              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${
                                !unlocked 
                                  ? 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm scale-105' 
                                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50'
                              }`}
                            >
                              {!unlocked && (
                                <span className="absolute top-1.5 right-1.5 p-0.5 bg-slate-200 rounded-full text-slate-500">
                                  <Lock size={10} />
                                </span>
                              )}
                              <span className="text-3xl mb-1 filter drop-shadow-sm">{type.emoji}</span>
                              <span className={`text-xs font-bold ${isSelected ? 'text-emerald-700' : unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                                {type.name}
                              </span>
                              {!unlocked && (
                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                                  {shopItem ? `${shopItem.price} c` : 'Locked'}
                                </span>
                              )}
                            </button>
                          )
                        })}
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

              <AnimatePresence>
                {showCategoryPicker && (
                  <motion.div
                    className="goal-category-picker-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCategoryPicker(false)}
                  >
                    <motion.div
                      className="goal-category-picker"
                      role="dialog"
                      aria-modal="true"
                      aria-label="Choose goal category"
                      initial={{ scale: 0.94, y: 12 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 12 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="goal-category-picker-top">
                        <div>
                          <span>Category</span>
                          <strong>Choose one</strong>
                        </div>
                        <button
                          type="button"
                          className="goal-category-picker-close"
                          onClick={() => setShowCategoryPicker(false)}
                          aria-label="Close category picker"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="goal-category-picker-list">
                        {goalCategoryOptions.map(category => (
                          <button
                            key={category}
                            type="button"
                            className={`goal-category-picker-option${form.category === category ? ' active' : ''}`}
                            onClick={() => setGoalCategory(category)}
                          >
                            <span>{category}</span>
                            {form.category === category && <Check size={16} aria-hidden="true" />}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`goal-category-picker-option${form.category === 'Custom' ? ' active' : ''}`}
                          onClick={() => setGoalCategory('Custom', { closePicker: false })}
                        >
                          <span>Custom</span>
                          {form.category === 'Custom' && <Check size={16} aria-hidden="true" />}
                        </button>
                        {form.category === 'Custom' && (
                          <div className="goal-category-picker-custom">
                            <input
                              className="quick-save-custom-category goal-category-custom"
                              value={customCategory}
                              onChange={e => setCustomCategory(e.target.value)}
                              placeholder="Write your own category"
                              maxLength={50}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="goal-category-picker-use"
                              onClick={() => {
                                if (customCategory.trim()) setShowCategoryPicker(false)
                              }}
                              disabled={!customCategory.trim()}
                            >
                              Use Custom
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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
