import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  LineChart,
  Plus,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  WalletCards,
} from 'lucide-react'
import { budgets as budgetApi, finance, recurring as recurringApi, targets as targetApi, transactions as transactionApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import GoalCompletionNotice from '../components/GoalCompletionNotice.jsx'
import { useLanguage } from '../i18n.jsx'

const categories = ['Food', 'Shopping', 'Transport', 'Entertainment', 'Education', 'Emergency', 'General', 'Other']

const money = (value) => `Yen ${Number(value || 0).toLocaleString()}`

const cardStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  background: 'white',
  boxShadow: 'var(--shadow-sm)',
}

export default function Planner() {
  const { language } = useLanguage()
  const [overview, setOverview] = useState(null)
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [petReaction, setPetReaction] = useState(null)
  const [goalCompletionNotice, setGoalCompletionNotice] = useState(null)
  const [budgetForm, setBudgetForm] = useState({ category: 'Food', monthly_limit: '' })
  const [emergencyForm, setEmergencyForm] = useState({ target_amount: '' })
  const [emergencyDeposit, setEmergencyDeposit] = useState({ amount: '' })
  const [recurringForm, setRecurringForm] = useState({
    name: '',
    amount: '',
    type: 'withdrawal',
    category: 'General',
    frequency: 'monthly',
    next_run_date: new Date().toISOString().slice(0, 10),
    target_id: '',
  })
  const { user, updateUser } = useAuth()



  useEffect(() => {
    loadPlanner()
  }, [])

  const loadPlanner = async () => {
    try {
      const [overviewRes, targetsRes] = await Promise.all([
        finance.overview(),
        targetApi.list('active'),
      ])
      setOverview(overviewRes.data)
      setTargets(targetsRes.data || [])
    } finally {
      setLoading(false)
    }
  }

  const coach = useMemo(() => {
    if (!overview) return null
    const riskyBudget = [...(overview.budgets || [])].sort((a, b) => b.percent - a.percent)[0]
    if (riskyBudget?.status === 'over') {
      return {
        title: `${riskyBudget.category} budget is over limit`,
        body: `You spent ${money(riskyBudget.spent)} against ${money(riskyBudget.monthly_limit)}. Freeze non-essential ${riskyBudget.category} spending first.`,
      }
    }
    if (riskyBudget?.status === 'warning') {
      return {
        title: `${riskyBudget.category} is close to the limit`,
        body: `You are at ${riskyBudget.percent}%. Keep the next few purchases small to finish the month cleanly.`,
      }
    }
    if (overview.forecast?.days_to_goal) {
      return {
        title: 'Goal path looks measurable',
        body: `At this pace, ${overview.forecast.target_name} can finish around ${overview.forecast.estimated_date}.`,
      }
    }
    return {
      title: 'Build the next useful signal',
      body: 'Add at least one budget and one recurring item so Pet Saver can warn you before money leaks happen.',
    }
  }, [overview])

  const saveBudget = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await budgetApi.save({
        category: budgetForm.category,
        monthly_limit: Number(budgetForm.monthly_limit || 0),
      })
      setBudgetForm({ ...budgetForm, monthly_limit: '' })
      await loadPlanner()
    } finally {
      setSaving(false)
    }
  }

  const createEmergencyFund = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await targetApi.create({
        name: 'Emergency Fund',
        description: 'Backup savings for urgent costs',
        target_amount: Number(emergencyForm.target_amount || 0),
        category: 'Emergency',
        deadline: null,
        avatar_type: 'dog',
        avatar_name: 'Mochi',
      })
      setEmergencyForm({ target_amount: '' })
      await loadPlanner()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const addEmergencyMoney = async (e) => {
    e.preventDefault()
    if (!overview?.emergency?.id) return
    setSaving(true)
    try {
      const res = await transactionApi.create({
        target_id: overview.emergency.id,
        amount: Number(emergencyDeposit.amount || 0),
        type: 'deposit',
        category: 'Emergency',
        note: 'Emergency fund deposit',
        date: new Date().toISOString().slice(0, 10),
      })
      if (res.data?.status === 'completed') {
        setPetReaction(null)
        setGoalCompletionNotice({
          goalName: overview.emergency.name,
          coinsEarned: Number(res.data?.coins_earned || 0),
        })
      } else {
        setPetReaction(res.data?.pet_reaction || null)
      }
      setEmergencyDeposit({ amount: '' })
      await loadPlanner()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveRecurring = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await recurringApi.create({
        ...recurringForm,
        amount: Number(recurringForm.amount || 0),
        target_id: recurringForm.target_id || null,
      })
      setRecurringForm({
        name: '',
        amount: '',
        type: 'withdrawal',
        category: 'General',
        frequency: 'monthly',
        next_run_date: new Date().toISOString().slice(0, 10),
        target_id: '',
      })
      await loadPlanner()
    } finally {
      setSaving(false)
    }
  }

  const deleteRecurring = async (id) => {
    if (!window.confirm('Delete this recurring item?')) return
    setSaving(true)
    try {
      await recurringApi.delete(id)
      await loadPlanner()
    } finally {
      setSaving(false)
    }
  }

  const claimMission = async (missionId) => {
    const res = await finance.claimMission(missionId)
    const coinBalance = Number(res.data?.coin_balance)
    if (Number.isFinite(coinBalance)) {
      updateUser({ coins: coinBalance })
    } else {
      updateUser((currentUser) => ({
        coins: Number(currentUser?.coins || 0) + Number(res.data?.coins || 0),
      }))
    }
    setPetReaction(res.data?.pet_reaction || null)
    await loadPlanner()
  }

  const downloadCsv = async () => {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL || '/api/index.php'
    const url = new URL(apiUrl, window.location.origin)
    url.searchParams.set('route', 'finance/export')
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const blob = await response.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = 'pet-saver-transactions.csv'
    a.click()
    URL.revokeObjectURL(href)
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <GoalCompletionNotice notice={goalCompletionNotice} onClose={() => setGoalCompletionNotice(null)} />

      <div className="page-header">
        <div className="page-title">
          <h2>Money Planner</h2>
          <p>Budgets, recurring money, missions, forecasts, receipts, and export in one place</p>
        </div>
        <button className="btn btn-primary" onClick={downloadCsv}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      {petReaction && (
        <motion.div
          className="pet-reaction-banner planner-pet-reaction"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="pet-reaction-emoji">{petReaction.emoji || '🐾'}</span>
          <div>
            <strong>{petReaction.message}</strong>
            <small>+{petReaction.exp_gain || 0} Pet EXP • Money progress became pet progress</small>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <SummaryCard icon={WalletCards} label="This Month Spent" value={money(overview?.month?.spent)} tone="#ef4444" />
        <SummaryCard icon={Target} label="This Month Saved" value={money(overview?.month?.saved)} tone="#10b981" />
        <SummaryCard icon={LineChart} label="Month-End Estimate" value={money(overview?.month?.projected_spending)} tone="#4D96FF" />
        <SummaryCard icon={ShieldCheck} label="Emergency Fund" value={overview?.emergency ? money(overview.emergency.current_amount) : 'Not set'} tone="#f59e0b" />
      </div>

      <section className="card" style={{ ...cardStyle, marginBottom: 20 }}>
        <SectionTitle icon={ShieldCheck} title="Emergency Fund" />
        {overview?.emergency ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontWeight: 850, marginBottom: 8 }}>
              <span>{overview.emergency.name}</span>
              <span>{money(overview.emergency.current_amount)} / {money(overview.emergency.target_amount)}</span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, overview.emergency.progress || 0)}%`, height: '100%', background: '#f59e0b' }} />
            </div>
            <form onSubmit={addEmergencyMoney} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, marginTop: 14 }}>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="Add money"
                value={emergencyDeposit.amount}
                onChange={(e) => setEmergencyDeposit({ amount: e.target.value })}
                required
              />
              <button className="btn btn-primary" disabled={saving}>
                <Plus size={16} /> Add Money
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={createEmergencyFund} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
            <input
              className="form-input"
              type="number"
              min="1"
              placeholder="Emergency target"
              value={emergencyForm.target_amount}
              onChange={(e) => setEmergencyForm({ target_amount: e.target.value })}
              required
            />
            <button className="btn btn-primary" disabled={saving}>
              <Plus size={16} /> Create
            </button>
          </form>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card" style={cardStyle}>
            <SectionTitle icon={AlertTriangle} title="Budget Limits" />
            <form onSubmit={saveBudget} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12, marginBottom: 16 }}>
              <select className="form-input" value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input className="form-input" type="number" min="0" placeholder="Monthly limit" value={budgetForm.monthly_limit} onChange={(e) => setBudgetForm({ ...budgetForm, monthly_limit: e.target.value })} />
              <button className="btn btn-primary" disabled={saving}><Plus size={16} /> Save</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(overview?.budgets || []).length === 0 && <EmptyLine text="Add category budgets to unlock automatic warnings." />}
              {(overview?.budgets || []).map((budget) => (
                <div key={budget.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: 6 }}>
                    <span>{budget.category}</span>
                    <span style={{ color: budget.status === 'over' ? '#ef4444' : budget.status === 'warning' ? '#f59e0b' : '#10b981' }}>
                      {budget.percent}% · {money(budget.spent)} / {money(budget.monthly_limit)}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, budget.percent)}%`, height: '100%', background: budget.status === 'over' ? '#ef4444' : budget.status === 'warning' ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={cardStyle}>
            <SectionTitle icon={Repeat} title="Recurring Savings and Expenses" />
            <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: '#f8fafc', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700 }}>
              Due items run automatically when you open the app. Delete a recurring item when a subscription or payment stops.
            </div>
            <form onSubmit={saveRecurring} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 10, marginBottom: 14 }}>
              <input className="form-input" placeholder="Name" value={recurringForm.name} onChange={(e) => setRecurringForm({ ...recurringForm, name: e.target.value })} required />
              <input className="form-input" type="number" min="1" placeholder="Amount" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })} required />
              <select className="form-input" value={recurringForm.type} onChange={(e) => setRecurringForm({ ...recurringForm, type: e.target.value })}>
                <option value="withdrawal">Expense</option>
                <option value="deposit">Savings</option>
              </select>
              <select className="form-input" value={recurringForm.frequency} onChange={(e) => setRecurringForm({ ...recurringForm, frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
              <select className="form-input" value={recurringForm.category} onChange={(e) => setRecurringForm({ ...recurringForm, category: e.target.value })}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
              <input className="form-input" type="date" value={recurringForm.next_run_date} onChange={(e) => setRecurringForm({ ...recurringForm, next_run_date: e.target.value })} />
              <select className="form-input" value={recurringForm.target_id} onChange={(e) => setRecurringForm({ ...recurringForm, target_id: e.target.value })}>
                <option value="">Active goal</option>
                {targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
              </select>
              <button className="btn btn-primary" disabled={saving}><Plus size={16} /> Add</button>
            </form>
            <div style={{ display: 'grid', gap: 10 }}>
              {(overview?.recurring || []).length === 0 && <EmptyLine text="No recurring entries yet." />}
              {(overview?.recurring || []).map((entry) => (
                <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div>
                    <strong>{entry.name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.frequency} · next {entry.next_run_date} · {entry.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 900, color: entry.type === 'deposit' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>{entry.type === 'deposit' ? '+' : '-'}{money(entry.amount)}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 10px' }}
                      onClick={() => deleteRecurring(entry.id)}
                      disabled={saving}
                      aria-label={`Delete ${entry.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card" style={{ ...cardStyle, background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)' }}>
            <SectionTitle icon={Sparkles} title="AI Spending Coach" />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#065f46', marginBottom: 8 }}>{coach?.title}</h3>
            <p style={{ color: '#047857', fontWeight: 650, lineHeight: 1.5 }}>{coach?.body}</p>
          </section>

          <section className="card" style={cardStyle}>
            <SectionTitle icon={LineChart} title="Goal Forecast" />
            {overview?.forecast ? (
              <div>
                <div style={{ fontSize: 28, fontWeight: 950 }}>
                  {overview.forecast.days_to_goal
                    ? language === 'ja' ? `${overview.forecast.days_to_goal}日` : `${overview.forecast.days_to_goal} days`
                    : language === 'ja' ? '貯金ペースが必要です' : 'Needs savings pace'}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 650 }}>
                  {language === 'ja'
                    ? `${overview.forecast.target_name}まで残り¥${Number(overview.forecast.remaining || 0).toLocaleString()}です。`
                    : `Remaining ${money(overview.forecast.remaining)} for ${overview.forecast.target_name}.`}
                </p>
              </div>
            ) : <EmptyLine text="Create an active goal to see a forecast." />}
          </section>

          <section className="card" style={cardStyle}>
            <SectionTitle icon={Trophy} title="Missions" />
            <div style={{ display: 'grid', gap: 10 }}>
              {(overview?.missions || []).map((mission) => (
                <div key={mission.id} style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>{mission.title}</strong>
                    <span>{mission.progress}/{mission.target}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '6px 0 10px' }}>{mission.desc}</p>
                  <button className="btn btn-primary" style={{ width: '100%' }} disabled={!mission.completed || mission.claimed} onClick={() => claimMission(mission.id)}>
                    <CheckCircle2 size={16} /> {mission.claimed ? 'Claimed' : `Claim ${mission.reward} coins`}
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <motion.div className="card" style={{ ...cardStyle, borderTop: `4px solid ${tone}` }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 800 }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 950, marginTop: 4 }}>{value}</div>
        </div>
        <Icon size={26} color={tone} />
      </div>
    </motion.div>
  )
}

function SectionTitle({ icon: Icon, title, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 900 }}>
        <Icon size={20} /> {title}
      </h3>
      {action}
    </div>
  )
}

function EmptyLine({ text }) {
  return <div style={{ padding: 14, border: '1px dashed var(--border-color)', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 650 }}>{text}</div>
}
