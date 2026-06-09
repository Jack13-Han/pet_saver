import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, ScanLine, Check, X, Sparkles, FileText, Store, DollarSign, Calendar, Tag } from 'lucide-react'
import { receipts as receiptApi, targets as targetApi } from '../api.js'

const simulateOCR = (file) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shops = ['7-Eleven', 'FamilyMart', 'Uniqlo', 'Muji', 'Starbucks', "McDonald's", 'Amazon', 'Apple Store']
      const categories = ['Food', 'Shopping', 'Electronics', 'Coffee', 'Groceries']
      const shop = shops[Math.floor(Math.random() * shops.length)]
      const total = Math.floor(Math.random() * 5000) + 100
      const date = new Date().toISOString().split('T')[0]
      const category = categories[Math.floor(Math.random() * categories.length)]
      resolve({
        shop_name: shop, total_price: total, date: date, category: category,
        items: [
          { name: 'Item 1', price: Math.floor(total * 0.4) },
          { name: 'Item 2', price: Math.floor(total * 0.3) },
          { name: 'Item 3', price: total - Math.floor(total * 0.7) }
        ],
        confidence: 85 + Math.floor(Math.random() * 14)
      })
    }, 1500)
  })
}

export default function ReceiptScanner() {
  const [image, setImage] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [targets, setTargets] = useState([])
  const [selectedTarget, setSelectedTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  React.useEffect(() => {
    targetApi.list('active').then(res => setTargets(res.data || []))
  }, [])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target.result)
    reader.readAsDataURL(file)
    setScanning(true)
    setResult(null)
    try {
      const ocrResult = await simulateOCR(file)
      setResult(ocrResult)
    } catch (err) { alert('OCR failed') }
    finally { setScanning(false) }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await receiptApi.create({
        shop_name: result.shop_name, total_price: result.total_price,
        date: result.date, category: result.category, items: result.items,
        target_id: selectedTarget || null, image_path: image
      })
      alert(`Receipt saved! ¥${result.total_price.toLocaleString()} added!`)
      setImage(null); setResult(null); setSelectedTarget('')
    } catch (err) { alert(err.message || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Receipt Scanner 📸</h2>
          <p>Snap a receipt, auto-detect details, save instantly!</p>
        </div>
        <div className="streak-badge" style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)' }}>
          <Sparkles size={20} /><span>BEST FEATURE</span>
        </div>
      </div>

      <div className="scanner-container">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div key="upload" className={`scanner-upload ${dragOver ? 'dragover' : ''}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f) }} />
              <div className="scanner-upload-icon">📷</div>
              <h3>Take a Photo or Upload Receipt</h3>
              <p>Drag & drop or click to select an image</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                <Upload size={18} /> Choose File
              </button>
            </motion.div>
          ) : (
            <motion.div key="preview" className="scanner-preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <img src={image} alt="Receipt" style={{ maxHeight: 300, objectFit: 'contain', borderRadius: 'var(--radius-md)', width: '100%' }} />
                {scanning && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <ScanLine size={48} />
                    </motion.div>
                    <p style={{ marginTop: 12, fontWeight: 700 }}>Scanning receipt...</p>
                    <p style={{ fontSize: 13, opacity: 0.8 }}>AI is detecting shop, price, and date</p>
                  </div>
                )}
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, background: 'var(--accent-green-light)', borderRadius: 'var(--radius-md)' }}>
                    <Check size={20} color="var(--accent-green)" />
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)' }}>Detected with {result.confidence}% confidence</span>
                  </div>

                  <div className="scanner-form">
                    <div className="form-group">
                      <label><Store size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Shop Name</label>
                      <input className="form-input" value={result.shop_name} readOnly />
                    </div>
                    <div className="form-group">
                      <label><DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Total Price</label>
                      <input className="form-input" value={`¥ ${result.total_price.toLocaleString()}`} readOnly />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Date</label>
                        <input className="form-input" type="date" value={result.date} readOnly />
                      </div>
                      <div className="form-group">
                        <label><Tag size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Category</label>
                        <input className="form-input" value={result.category} readOnly />
                      </div>
                    </div>
                    <div className="form-group">
                      <label><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Items Detected</label>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{item.name}</span><span>¥{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 4, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                          <span>Total</span><span>¥{result.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>💰 Add to Savings Goal (Optional)</label>
                      <select className="form-input" value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}>
                        <option value="">Don't add to goal</option>
                        {targets.map(t => <option key={t.id} value={t.id}>{t.name} (¥{parseInt(t.current_amount).toLocaleString()} / ¥{parseInt(t.target_amount).toLocaleString()})</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setImage(null); setResult(null); setSelectedTarget('') }} disabled={saving}>
                        <X size={18} /> Cancel
                      </button>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : <><Check size={18} /> Save Receipt</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
