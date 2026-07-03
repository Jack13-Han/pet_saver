import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lottie from 'lottie-react'
import { Coins, Eye, Lock, X } from 'lucide-react'
import { shop as shopApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarTypes } from '../petAssets.js'
import shibaSadAnimation from '../assets/lottie/shiba-sad.json'
import shoppingAnimation from '../assets/lottie/shopping.json'

export default function Shop() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [notice, setNotice] = useState(null)
  const { user, updateUser } = useAuth()

  useEffect(() => { loadData() }, [])
  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 3600)
    return () => clearTimeout(timer)
  }, [notice])

  const loadData = async () => {
    try {
      const res = await shopApi.list()
      setItems(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleBuy = async (item) => {
    if (purchasing) return
    if (item.owned) return
    if ((user?.coins || 0) < item.price) {
      setNotice({
        type: 'error',
        title: 'Not enough coins',
        message: `You need ${item.price.toLocaleString()} coins to unlock ${item.name}.`,
      })
      return
    }
    setPurchasing(item.id)
    try {
      await shopApi.buy(item.id)
      updateUser({ coins: user.coins - item.price })
      setNotice({
        type: 'success',
        title: 'Congratulations!',
        message: `You've unlocked a new avatar: ${item.name}.`,
      })
      await loadData()
    } catch (err) {
      setNotice({
        type: 'error',
        title: err.message === 'Not enough coins' ? 'Not enough coins' : 'Purchase failed',
        message: err.message || 'Please try again.',
      })
    }
    finally { setPurchasing(null) }
  }

  const avatarItems = items.filter(item => item.category === 'avatar' && item.avatar_type)
  const getItemIcon = (item) => {
    if (item.avatar_type) return avatarTypes.find(type => type.id === item.avatar_type)?.emoji || item.icon
    return item.icon
  }

  if (loading) return <div className="loading-screen"><div className="loading-paw">🐾</div></div>

  return (
    <div className="animate-fade-in">
      <AnimatePresence>
        {notice && (
          <motion.div
            className="shop-notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotice(null)}
          >
            <motion.div
              className={`shop-notification ${notice.type}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Lottie
                animationData={notice.type === 'success' ? shoppingAnimation : shibaSadAnimation}
                loop={notice.type !== 'success'}
                className="shop-notification-animation"
              />
              <div className="shop-notification-copy">
                <h3>{notice.title}</h3>
                <p>{notice.message}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header">
        <div className="page-title">
          <h2>Shop 🛒</h2>
          <p>Unlock new avatars for your savings goals.</p>
        </div>
        <div className="streak-badge" style={{ background: 'var(--accent-yellow-light)', color: 'var(--accent-yellow)' }}>
          <Coins size={20} />
          <span>{user?.coins?.toLocaleString() || 0} Coins</span>
        </div>
      </div>

      <div className="shop-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <AnimatePresence>
          {avatarItems.map((item, i) => (
            <motion.div key={item.id} className={`shop-item ${item.owned ? 'owned' : ''}`}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => handleBuy(item)}>
              {item.owned && <div className="shop-item-owned-badge">Owned</div>}
              <span className="shop-item-icon">{getItemIcon(item)}</span>
              <div className="shop-item-name">{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>{item.description}</div>
              <div className="shop-item-price">🪙 {item.price}</div>
              <button
                type="button"
                className="shop-preview-button"
                onClick={(event) => {
                  event.stopPropagation()
                  setPreviewItem(item)
                }}
              >
                <Eye size={14} /> Preview
              </button>
              {!item.owned && (
                <button className="btn btn-primary" style={{ marginTop: 12, padding: '8px 16px', fontSize: 13, width: '100%' }}
                  disabled={purchasing === item.id}>
                  {purchasing === item.id ? 'Buying...' : user?.coins < item.price ? <><Lock size={14} /> Need coins</> : 'Buy'}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              className="shop-preview-modal"
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="shop-preview-close" onClick={() => setPreviewItem(null)} aria-label="Close preview">
                <X size={18} />
              </button>
              <div className="shop-preview-title">{previewItem.name}</div>
              <div className="shop-preview-stage">
                <motion.div
                  className="shop-preview-animal"
                  animate={{ y: [0, -18, 0], scale: [1, 1.08, 1], rotate: [-2, 2, -2] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.18, y: -22 }}
                  whileTap={{ scale: 0.92 }}
                >
                  {getItemIcon(previewItem)}
                </motion.div>
              </div>
              <p>This is how the avatar moves on Home.</p>
              <div className="shop-preview-price">🪙 {previewItem.price} Coins</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
