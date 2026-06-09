import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Coins, Lock } from 'lucide-react'
import { shop as shopApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

const categories = [
  { id: 'all', label: 'All', icon: '🛍️' },
  { id: 'hat', label: 'Hats', icon: '🧢' },
  { id: 'glasses', label: 'Glasses', icon: '👓' },
  { id: 'scarf', label: 'Scarves', icon: '🧣' },
  { id: 'toy', label: 'Toys', icon: '🎾' },
  { id: 'background', label: 'Decor', icon: '🪴' },
]

export default function Shop() {
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const { user, updateUser } = useAuth()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await shopApi.list()
      setItems(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleBuy = async (item) => {
    if (item.owned) return
    if (user.coins < item.price) { alert('Not enough coins!'); return }
    setPurchasing(item.id)
    try {
      await shopApi.buy(item.id)
      updateUser({ coins: user.coins - item.price })
      loadData()
    } catch (err) { alert(err.message) }
    finally { setPurchasing(null) }
  }

  const filtered = category === 'all' ? items : items.filter(i => i.category === category)

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Shop 🛒</h2>
          <p>Spend your coins on cool accessories!</p>
        </div>
        <div className="streak-badge" style={{ background: 'var(--accent-yellow-light)', color: 'var(--accent-yellow)' }}>
          <Coins size={20} />
          <span>{user?.coins?.toLocaleString() || 0} Coins</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', padding: '4px 0' }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'none',
              background: category === cat.id ? 'var(--accent-green)' : 'white',
              color: category === cat.id ? 'white' : 'var(--text-secondary)',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              boxShadow: category === cat.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
            }}>
            <span>{cat.icon}</span><span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="shop-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <AnimatePresence>
          {filtered.map((item, i) => (
            <motion.div key={item.id} className={`shop-item ${item.owned ? 'owned' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => handleBuy(item)}>
              {item.owned && <div className="shop-item-owned-badge">Owned</div>}
              <span className="shop-item-icon">{item.icon}</span>
              <div className="shop-item-name">{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{item.description}</div>
              <div className="shop-item-price">🪙 {item.price}</div>
              {!item.owned && (
                <button className="btn btn-primary" style={{ marginTop: 12, padding: '8px 16px', fontSize: 13, width: '100%' }}
                  disabled={purchasing === item.id || user?.coins < item.price}>
                  {purchasing === item.id ? 'Buying...' : user?.coins < item.price ? <><Lock size={14} /> Need coins</> : 'Buy'}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
