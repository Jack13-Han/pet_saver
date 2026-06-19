import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Lightbulb, AlertTriangle, ArrowRight, Award } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { transactions as txApi } from '../api.js'

const categoryMeta = {
  Food: { emoji: '🍔', color: '#FF6B6B' },
  Shopping: { emoji: '🛍️', color: '#4D96FF' },
  Transport: { emoji: '🚗', color: '#6BCB77' },
  Entertainment: { emoji: '🎬', color: '#FFD93D' },
  Education: { emoji: '📚', color: '#9B72CF' },
  Emergency: { emoji: '🚨', color: '#FF9F29' },
  General: { emoji: '📁', color: '#FF80B5' },
  Other: { emoji: '⚙️', color: '#90A4AE' }
}

export default function Insights() {
  const [data, setData] = useState({ categories: [], totals: { savings: 0, spending: 0 }, monthlyTrend: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const res = await txApi.getInsights()
      setData(res.data || { categories: [], totals: { savings: 0, spending: 0 }, monthlyTrend: [] })
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch insights data. Please try again.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-paw">🐾</div>
        <p>Analyzing your spending data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48, color: '#EF4444' }}>
        <AlertTriangle size={48} style={{ marginBottom: 16 }} />
        <h3>Error Occurred</h3>
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={loadInsights}>
          Retry
        </button>
      </div>
    )
  }

  const { categories, totals, monthlyTrend } = data
  const totalSpending = totals.spending || 0
  const totalSavings = totals.savings || 0

  // Format data for PieChart
  const pieData = categories.map(cat => ({
    name: cat.category,
    value: parseFloat(cat.total),
    color: categoryMeta[cat.category]?.color || '#94A3B8',
    emoji: categoryMeta[cat.category]?.emoji || '💰'
  }))

  // Find top spending category
  const topCategory = categories.length > 0 ? categories[0] : null

  // Calculate savings rate
  const totalFlow = totalSavings + totalSpending
  const savingsRate = totalFlow > 0 ? Math.round((totalSavings / totalFlow) * 100) : 0

  // Burmese Advice generation based on spending patterns
  const getSmartAdvice = () => {
    if (!topCategory || topCategory.total === 0) {
      return {
        title: "Start Saving 🎉",
        desc: "You don't have any spending recorded yet. Set your first savings goal and start growing your savings!"
      }
    }

    const catName = topCategory.category
    const catPercent = Math.round((parseFloat(topCategory.total) / totalSpending) * 100)

    switch (catName) {
      case 'Food':
        return {
          title: "Reduce Food Expenses 🍳",
          desc: `You spent ${catPercent}% of your budget on food. Consider preparing meals at home instead of dining out to save a significant amount of money.`
        }
      case 'Shopping':
        return {
          title: "Control Shopping Expenses 🛍️",
          desc: `Shopping accounts for ${catPercent}% of your spending. Try the '24-hour rule'—wait a day before making non-essential purchases to check if you still need them.`
        }
      case 'Transport':
        return {
          title: "Optimize Transport Costs 🚗",
          desc: `Transport accounts for ${catPercent}% of your spending. Try using public transit or walking for short trips to stay healthy and save on transit fees.`
        }
      case 'Entertainment':
        return {
          title: "Manage Entertainment Spending 🎬",
          desc: `You spent ${catPercent}% on entertainment. Review your paid subscriptions and cancel any services you haven't used recently to cut back.`
        }
      default:
        return {
          title: "Balance Your Budget ⚖️",
          desc: `Your top expense category is '${catName}', accounting for ${catPercent}% of your budget. Try prioritizing essential needs in this category.`
        }
    }
  }

  const advice = getSmartAdvice()

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div style={{ background: '#1e293b', color: '#fff', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
            {data.emoji} {data.name}
          </p>
          <p style={{ margin: '4px 0 0 0', fontWeight: 800, color: '#10b981', fontSize: 16 }}>
            ¥{data.value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Spending Insights 📊</h2>
          <p>Detailed breakdown of your expenses and savings</p>
        </div>
      </div>

      {/* Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Total Spent Card */}
        <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>Total Expenses</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: '#EF4444' }}>¥{totalSpending.toLocaleString()}</h3>
            </div>
            <div style={{ background: '#FEE2E2', color: '#EF4444', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContents: 'center', justifyContent: 'center' }}>
              <TrendingDown size={24} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Sum of all withdrawals logged</span>
          </div>
        </motion.div>

        {/* Total Saved Card */}
        <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>Total Savings</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: '#10B981' }}>¥{totalSavings.toLocaleString()}</h3>
            </div>
            <div style={{ background: '#D1FAE5', color: '#10B981', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Sum of all savings deposits</span>
          </div>
        </motion.div>

        {/* Savings Rate Card */}
        <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>Savings Rate</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--accent-purple)' }}>{savingsRate}%</h3>
            </div>
            <div style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--bg-primary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent-purple)', height: '100%', width: `${savingsRate}%` }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Chart Column */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieIcon size={20} className="text-emerald-500" /> Category Breakdown
          </h3>
          
          {pieData.length > 0 ? (
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>📊</span>
              <p style={{ fontWeight: 600 }}>No spending data recorded yet.</p>
            </div>
          )}
        </motion.div>

        {/* Detailed Breakdown List Column */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
            Category Details
          </h3>
          
          {categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categories.map((cat, index) => {
                const amount = parseFloat(cat.total)
                const percent = Math.round((amount / totalSpending) * 100)
                const meta = categoryMeta[cat.category] || { emoji: '💰', color: '#94A3B8' }
                
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                        <span style={{ fontSize: 15 }}>{cat.category}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 15 }}>¥{amount.toLocaleString()}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>({percent}%)</span>
                      </div>
                    </div>
                    {/* Progress Fill bar */}
                    <div style={{ background: 'var(--bg-primary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div 
                        style={{ background: meta.color, height: '100%' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600 }}>No category details available.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Monthly Trend and Smart Advice */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Monthly Trend Chart */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} className="text-blue-500" /> Monthly Spending Trend
          </h3>
          
          {monthlyTrend.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="month_year" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ fontWeight: 700 }}
                  />
                  <Bar dataKey="total" name="Spent (¥)" fill="#4D96FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600 }}>No monthly spending records found.</p>
            </div>
          )}
        </motion.div>

        {/* Smart Advice Card */}
        <motion.div 
          className="card" 
          style={{ 
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', 
            border: '1px solid #FDE68A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B45309', marginBottom: 16 }}>
              <Lightbulb size={24} />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Smart Saving Advice</h3>
            </div>
            
            <h4 style={{ color: '#92400E', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{advice.title}</h4>
            <p style={{ color: '#78350F', fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>
              {advice.desc}
            </p>
          </div>

          <div 
            style={{ 
              marginTop: 20, 
              background: 'rgba(255, 255, 255, 0.6)', 
              borderRadius: '16px', 
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => window.location.href = '/goals'}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Set new goals and grow your savings</span>
            <ArrowRight size={18} color="#92400E" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
