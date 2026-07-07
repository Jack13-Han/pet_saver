import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpCircle, ArrowDownCircle, Calendar, Search, PieChart as PieChartIcon } from 'lucide-react'
import { transactions as txApi } from '../api.js'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import FinanceCalendar from '../components/FinanceCalendar.jsx'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await txApi.list()
      setTransactions(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = transactions.filter(tx => {
    const matchesSearch = !search || (tx.note && tx.note.toLowerCase().includes(search.toLowerCase())) || (tx.target_name && tx.target_name.toLowerCase().includes(search.toLowerCase()))
    return matchesSearch
  })

  const savings = filtered.filter(t => t.type === 'deposit')
  const expenses = filtered.filter(t => t.type === 'withdrawal')

  const totalDeposit = savings.reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalWithdraw = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0)

  // Chart data calculation
  const expenseByCategory = expenses.reduce((acc, tx) => {
    // Note format is often "Category · Note"
    let category = 'General'
    if (tx.note && tx.note.includes(' · ')) {
      category = tx.note.split(' · ')[0].trim()
    }
    
    if (!acc[category]) acc[category] = 0
    acc[category] += parseFloat(tx.amount)
    return acc
  }, {})

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key]
  })).sort((a, b) => b.value - a.value)

  const expenseByDateRaw = expenses.reduce((acc, tx) => {
    // Keep date string directly from DB (YYYY-MM-DD or full timestamp)
    const date = tx.transaction_date.split(' ')[0].split('T')[0] // normalize to YYYY-MM-DD
    if (!acc[date]) acc[date] = 0
    acc[date] += parseFloat(tx.amount)
    return acc
  }, {})

  const barData = Object.keys(expenseByDateRaw).sort().map(key => ({
    date: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: expenseByDateRaw[key]
  }))

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Expenses & Savings 📊</h2>
          <p>Track your spending and savings clearly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <ArrowUpCircle size={24} color="var(--accent-green)" />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total Saved</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-green)' }}>¥{totalDeposit.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <ArrowDownCircle size={24} color="#EF4444" />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total Spent</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>¥{totalWithdraw.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Calendar size={24} color="var(--accent-blue)" />
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Net Savings</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-blue)' }}>¥{(totalDeposit - totalWithdraw).toLocaleString()}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 40, width: '100%' }} placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <FinanceCalendar onChanged={loadData} />
      </div>

      {/* Charts Section */}
      {(pieData.length > 0 || barData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieChartIcon size={20} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Expense Breakdown</h3>
              </div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          {barData.length > 0 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Calendar size={20} color="#EF4444" />
                <h3 style={{ margin: 0 }}>Daily Spending</h3>
              </div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `¥${value}`} width={60} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `¥${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lists Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        
        {/* Expenses List */}
        <div>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
            <ArrowDownCircle size={20} /> Expenses List
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {expenses.length > 0 ? expenses.map((tx, i) => (
              <motion.div key={tx.id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid #EF4444`, padding: '16px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-full)',
                  background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                }}>💸</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.note || 'Used money'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                    {tx.target_name} • {new Date(tx.transaction_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#EF4444' }}>
                  -¥{parseFloat(tx.amount).toLocaleString()}
                </div>
              </motion.div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: 'var(--text-secondary)' }}>No expenses found</p>
              </div>
            )}
          </div>
        </div>

        {/* Savings List */}
        <div>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-green)' }}>
            <ArrowUpCircle size={20} /> Savings List
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {savings.length > 0 ? savings.map((tx, i) => (
              <motion.div key={tx.id} className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid var(--accent-green)`, padding: '16px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                }}>💰</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.note || 'Saved money'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                    {tx.target_name} • {new Date(tx.transaction_date).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-green)' }}>
                  +¥{parseFloat(tx.amount).toLocaleString()}
                </div>
              </motion.div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <p style={{ color: 'var(--text-secondary)' }}>No savings found</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
