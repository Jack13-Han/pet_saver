import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Lightbulb,
  PieChart as PieIcon,
  TrendingDown,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { transactions as txApi, finance } from '../api.js'
import { useLanguage } from '../i18n.jsx'

const emptyInsights = {
  categories: [],
  totals: { savings: 0, spending: 0 },
  monthlyTrend: [],
}

const categoryMeta = {
  Food: { label: 'Food', color: '#FF6B6B' },
  Shopping: { label: 'Shopping', color: '#4D96FF' },
  Transport: { label: 'Transport', color: '#6BCB77' },
  Entertainment: { label: 'Entertainment', color: '#FFD93D' },
  Education: { label: 'Education', color: '#9B72CF' },
  Emergency: { label: 'Emergency', color: '#FF9F29' },
  General: { label: 'General', color: '#FF80B5' },
  Other: { label: 'Other', color: '#90A4AE' },
}

const money = (value) => `Yen ${Number(value || 0).toLocaleString()}`

export default function Insights() {
  const { language } = useLanguage()
  const [data, setData] = useState(emptyInsights)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [weeklyReportText, setWeeklyReportText] = useState('')
  const [loadingReport, setLoadingReport] = useState(false)

  const fetchWeeklyReport = async () => {
    setShowWeeklyModal(true)
    setLoadingReport(true)
    try {
      const res = await finance.weeklyReport(language)
      setWeeklyReportText(res.data?.report || 'Failed to generate weekly report.')
    } catch (err) {
      console.error(err)
      setWeeklyReportText('Error generating weekly AI report: ' + err.message)
    } finally {
      setLoadingReport(false)
    }
  }

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => {
      let cleanLine = line.trim();
      if (!cleanLine) return <div key={index} style={{ height: 8 }} />;
      
      // Headers
      if (cleanLine.startsWith("###")) {
        return <h4 key={index} style={{ fontSize: 15, fontWeight: 800, color: "var(--text-main)", marginTop: 12, marginBottom: 6 }}>{cleanLine.replace("###", "").trim()}</h4>;
      }
      if (cleanLine.startsWith("##")) {
        return <h3 key={index} style={{ fontSize: 17, fontWeight: 800, color: "var(--text-main)", marginTop: 16, marginBottom: 8 }}>{cleanLine.replace("##", "").trim()}</h3>;
      }
      
      // Bullet points
      if (cleanLine.startsWith("-") || cleanLine.startsWith("*")) {
        const content = cleanLine.substring(1).trim();
        return (
          <li key={index} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", marginLeft: 16, listStyleType: "disc", marginBottom: 4 }}>
            {parseBold(content)}
          </li>
        );
      }
      
      return (
        <p key={index} style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 8 }}>
          {parseBold(cleanLine)}
        </p>
      );
    });
  }

  const parseBold = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ fontWeight: 800, color: "var(--text-main)" }}>{part}</strong>;
      }
      return part;
    });
  }

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await txApi.getInsights()
      setData({ ...emptyInsights, ...(res.data || {}) })
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to fetch insights data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-paw">...</div>
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

  const categories = data.categories || []
  const totals = data.totals || emptyInsights.totals
  const monthlyTrend = data.monthlyTrend || []
  const totalSpending = Number(totals.spending || 0)
  const totalSavings = Number(totals.savings || 0)

  const pieData = categories.map((cat) => ({
    name: cat.category || 'Other',
    value: Number(cat.total || 0),
    color: categoryMeta[cat.category]?.color || '#94A3B8',
  }))

  const topCategory = categories.length > 0 ? categories[0] : null
  const totalFlow = totalSavings + totalSpending
  const savingsRate = totalFlow > 0 ? Math.round((totalSavings / totalFlow) * 100) : 0

  const getSmartAdvice = () => {
    if (!topCategory || Number(topCategory.total || 0) === 0 || totalSpending === 0) {
      return {
        title: 'Start Saving',
        desc: 'You do not have any spending recorded yet. Add expenses and savings to see useful advice here.',
      }
    }

    const catName = topCategory.category || 'Other'
    const catPercent = Math.round((Number(topCategory.total || 0) / totalSpending) * 100)

    switch (catName) {
      case 'Food':
        return {
          title: 'Reduce Food Expenses',
          desc: `Food is ${catPercent}% of your spending. Preparing meals at home can help reduce daily costs.`,
        }
      case 'Shopping':
        return {
          title: 'Control Shopping Expenses',
          desc: `Shopping is ${catPercent}% of your spending. Try waiting 24 hours before non-essential purchases.`,
        }
      case 'Transport':
        return {
          title: 'Optimize Transport Costs',
          desc: `Transport is ${catPercent}% of your spending. Public transit or walking short trips may help you save.`,
        }
      case 'Entertainment':
        return {
          title: 'Manage Entertainment Spending',
          desc: `Entertainment is ${catPercent}% of your spending. Check subscriptions you no longer use.`,
        }
      default:
        return {
          title: 'Balance Your Budget',
          desc: `${catName} is ${catPercent}% of your spending. Review that category and focus first on essentials.`,
        }
    }
  }

  const advice = getSmartAdvice()

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div style={{ background: '#1e293b', color: '#fff', padding: '12px 16px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #334155' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{item.name}</p>
          <p style={{ margin: '4px 0 0 0', fontWeight: 800, color: '#10b981', fontSize: 16 }}>
            {money(item.value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-title">
          <h2>Spending Insights</h2>
          <p>Detailed breakdown of your expenses and savings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>Total Expenses</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: '#EF4444' }}>{money(totalSpending)}</h3>
            </div>
            <div style={{ background: '#FEE2E2', color: '#EF4444', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={24} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Sum of all withdrawals logged</span>
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>Total Savings</span>
              <h3 style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: '#10B981' }}>{money(totalSavings)}</h3>
            </div>
            <div style={{ background: '#D1FAE5', color: '#10B981', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>Sum of all savings deposits</span>
          </div>
        </motion.div>

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
          <div style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--bg-primary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent-purple)', height: '100%', width: `${savingsRate}%` }} />
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieIcon size={20} className="text-emerald-500" /> Category Breakdown
          </h3>

          {pieData.length > 0 ? (
            <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
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
              <PieIcon size={48} style={{ marginBottom: 12 }} />
              <p style={{ fontWeight: 600 }}>No spending data recorded yet.</p>
            </div>
          )}
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Category Details</h3>

          {categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {categories.map((cat, index) => {
                const amount = Number(cat.total || 0)
                const percent = totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0
                const meta = categoryMeta[cat.category] || categoryMeta.Other

                return (
                  <div key={`${cat.category}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 999, background: meta.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 15 }}>{meta.label || cat.category}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 15 }}>{money(amount)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>({percent}%)</span>
                      </div>
                    </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
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
                    formatter={(value) => money(value)}
                  />
                  <Bar dataKey="total" name="Spent" fill="#4D96FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontWeight: 600 }}>No monthly spending records found.</p>
            </div>
          )}
        </motion.div>

        <motion.div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            border: '1px solid #FDE68A',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
            <p style={{ color: '#78350F', fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>{advice.desc}</p>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed rgba(180, 83, 9, 0.2)' }}>
              <h4 style={{ color: '#92400E', fontSize: 15, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#8B5CF6" />
                Weekly AI Finance Report
              </h4>
              <p style={{ color: '#78350F', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                Get a personalized AI analysis of this week's spending, savings, and goal progress.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchWeeklyReport}
                type="button"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={16} />
                Generate AI Report
              </motion.button>
            </div>
          </div>

          <button
            type="button"
            style={{
              marginTop: 20,
              background: 'rgba(255, 255, 255, 0.6)',
              border: 'none',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              width: '100%',
            }}
            onClick={() => {
              window.location.href = '/goals'
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Set new goals and grow your savings</span>
            <ArrowRight size={18} color="#92400E" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showWeeklyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setShowWeeklyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 24,
                width: '100%',
                maxWidth: 550,
                maxHeight: '85vh',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      background: 'var(--accent-purple-light)',
                      color: 'var(--accent-purple)',
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      Weekly AI Report
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                      Your personalized 7-day financial summary
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWeeklyModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div
                style={{
                  padding: 24,
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 200,
                }}
              >
                {loadingReport ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 250,
                      gap: 16,
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        color: 'var(--accent-purple)',
                      }}
                    >
                      <Sparkles size={48} />
                    </motion.div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Analyzing your weekly finances...
                    </p>
                  </div>
                ) : (
                  <div style={{ wordBreak: 'break-word' }}>
                    {renderMarkdown(weeklyReportText)}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  background: 'var(--bg-primary)',
                }}
              >
                <button
                  className="btn btn-secondary"
                  style={{ borderRadius: 12 }}
                  onClick={() => setShowWeeklyModal(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
