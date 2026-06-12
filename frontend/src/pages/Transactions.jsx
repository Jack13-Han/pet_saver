import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpCircle, ArrowDownCircle, Calendar, Search, Filter } from 'lucide-react'
import { transactions as txApi } from '../api.js'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
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
    const matchesFilter = filter === 'all' || tx.type === filter
    const matchesSearch = !search || (tx.note && tx.note.toLowerCase().includes(search.toLowerCase())) || (tx.target_name && tx.target_name.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const totalDeposit = filtered.filter(t => t.type === 'deposit').reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const totalWithdraw = filtered.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + parseFloat(t.amount), 0)

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Expenses & Savings 📊</h2>
          <p>Track every penny you save and spend</p>
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
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Total Used</span>
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
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 40 }} placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'deposit', 'withdrawal'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)', border: 'none',
                  background: filter === f ? 'var(--accent-green)' : 'var(--border-color)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
                }}>
                {f === 'all' ? 'All' : f === 'deposit' ? 'Saved +' : 'Used -'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((tx, i) => (
          <motion.div key={tx.id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: `4px solid ${tx.type === 'deposit' ? 'var(--accent-green)' : '#EF4444'}` }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-full)',
              background: tx.type === 'deposit' ? 'var(--accent-green-light)' : '#FEE2E2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
            }}>{tx.type === 'deposit' ? '💰' : '💸'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{tx.note || (tx.type === 'deposit' ? 'Saved money' : 'Used money')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
                {tx.target_name} • {new Date(tx.transaction_date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: tx.type === 'deposit' ? 'var(--accent-green)' : '#EF4444' }}>
              {tx.type === 'deposit' ? '+' : '-'}¥{parseFloat(tx.amount).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Filter size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No transactions found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Start saving to see your transactions here!</p>
        </div>
      )}
    </div>
  )
}
