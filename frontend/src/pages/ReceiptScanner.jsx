import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ScanLine, Check, X, Sparkles, FileText, Store, DollarSign, Calendar, Tag, Info, Receipt } from 'lucide-react'
import { receipts as receiptApi, targets as targetApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

// Convert the receipt image into the base64 shape expected by the backend scanner.
const fileToGenerativePart = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        },
      });
    };
    reader.readAsDataURL(file);
  });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const realOCR = async (file) => {
  const today = new Date().toISOString().split('T')[0];
  const imagePart = await fileToGenerativePart(file);

  // Exponential Backoff Retry mechanism (up to 3 attempts) if server is overloaded
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await receiptApi.scan({
        image: imagePart.inlineData.data,
        mime_type: imagePart.inlineData.mimeType,
      });

      const aiParsed = response.data || {};
      const totalPrice = Number(aiParsed.total_price) || 0;

      return {
        shop_name: aiParsed.shop_name || 'Unknown Shop',
        total_price: totalPrice,
        date: aiParsed.date || today,
        category: 'Shopping',
        items: [{ name: 'Receipt total', price: totalPrice }],
        confidence: totalPrice > 0 ? 100 : 65
      };

    } catch (err) {
      console.warn(`Receipt scan attempt ${attempt} failed: ${err.message}`);
      
      // If a 503 Overloaded Error or high demand occurs, wait briefly and retry
      const retryable = err.status === 503 || err.message?.includes('503') || err.message?.toLowerCase().includes('overloaded');
      if (retryable && attempt < maxRetries) {
        await delay(attempt * 2000);
        continue;
      }

      // If retries are exhausted, fallback to default parsing values
      console.error("Gemini receipt scan failed:", err);
      
      return {
        shop_name: 'Unknown Shop',
        total_price: 0,
        date: today,
        category: 'Shopping',
        items: [{ name: 'Manual entry', price: 0 }],
        confidence: 31,
        scan_error: err.message || 'AI scan failed. Please enter the receipt details manually.'
      };
    }
  }
};

export default function ReceiptScanner() {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
  const [scanning, setScanning] = useState(false)



  const [result, setResult] = useState(null)
  const [targets, setTargets] = useState([])
  const [receipts, setReceipts] = useState([])
  const [selectedTarget, setSelectedTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [petReaction, setPetReaction] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  React.useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [targetRes, receiptRes] = await Promise.all([
        targetApi.list('active'),
        receiptApi.list(),
      ])
      setTargets(targetRes.data || [])
      setReceipts(receiptRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFile = useCallback(async (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target.result)
    reader.readAsDataURL(file)

    setScanning(true)
    setResult(null)

    try {
      const ocrResult = await realOCR(file)
      setResult(ocrResult)
    } catch (err) {
      console.error(err)
      const today = new Date().toISOString().split('T')[0]
      setResult({
        shop_name: 'Unknown Shop',
        total_price: 0,
        date: today,
        category: 'Shopping',
        items: [{ name: 'Manual entry', price: 0 }],
        confidence: 31,
        scan_error: err.message || 'OCR failed. Please enter the receipt details manually.',
      })
    } finally {
      setScanning(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }, [handleFile])

  const handleSave = async () => {
    if (!result) return

    setSaving(true)

    try {
      const response = await receiptApi.create({
        shop_name: result.shop_name,
        total_price: result.total_price,
        date: result.date,
        category: result.category,
        items: result.items,
        target_id: selectedTarget || null
      })

      setPetReaction(response.data?.pet_reaction || null)
      alert(`${response.data?.pet_reaction?.message || 'Receipt recorded!'} ¥${result.total_price.toLocaleString()} saved as Expense!`)
      setImage(null)
      setResult(null)
      setSelectedTarget('')
      loadInitialData()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-paw">🐾</div>
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h2>Receipt Scanner 📸</h2>
          <p>Snap a receipt, auto-detect details, save instantly!</p>
        </div>

        <div className="streak-badge" style={{ background: 'var(--accent-purple-light)', color: 'var(--accent-purple)' }}>
          <Sparkles size={20} />
          <span>BEST FEATURE</span>
        </div>
      </div>

      {petReaction && (
        <motion.div
          className="pet-reaction-banner planner-pet-reaction"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="pet-reaction-emoji">{petReaction.emoji || '🧾'}</span>
          <div>
            <strong>{petReaction.message}</strong>
            <small>+{petReaction.exp_gain || 0} Pet EXP for tracking your money</small>
          </div>
        </motion.div>
      )}

      <div className="scanner-container">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              className={`scanner-upload ${dragOver ? 'dragover' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files[0]
                  if (f) handleFile(f)
                }}
              />

              <div className="scanner-upload-icon">📷</div>
              <h3>Take a Photo or Upload Receipt</h3>
              <p>Drag & drop or click to select an image</p>

              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload size={18} />
                Choose File
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              className="scanner-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <img
                  src={image}
                  alt="Receipt"
                  style={{
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    width: '100%'
                  }}
                />

                {scanning && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.6)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <ScanLine size={48} />
                    </motion.div>

                    <p style={{ marginTop: 12, fontWeight: 700 }}>
                      Scanning receipt...
                    </p>
                    <p style={{ fontSize: 13, opacity: 0.8 }}>
                      Gemini AI is detecting shop, price, and date
                    </p>
                  </div>
                )}
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-[28px] border border-slate-200 shadow-md p-6 sm:p-8 mt-6 space-y-6"
                >
                  {/* Status Banner */}
                  <div
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${
                      result.confidence === 100 
                        ? 'bg-red-50/60 border-red-100 text-red-700' 
                        : 'bg-amber-50/60 border-amber-100 text-amber-700'
                    }`}
                  >
                    <Check size={20} className={result.confidence === 100 ? "text-red-500" : "text-amber-500"} />
                    <span className="font-extrabold text-sm">
                      {result.confidence === 100 
                        ? `Expense Detected via Gemini AI (Confidence: ${result.confidence}%)` 
                        : "AI scan could not read this receipt. Please enter the details manually."}
                    </span>
                  </div>
                  {result.scan_error && (
                    <div className="flex items-center gap-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-xs font-semibold">
                      <Info size={14} className="flex-shrink-0" />
                      <span>{result.scan_error}</span>
                    </div>
                  )}

                  {/* Form Details */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <Store size={16} className="text-red-500" />
                        Shop Name
                      </label>
                      <input 
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400" 
                        value={result.shop_name} 
                        onChange={(e) => setResult({...result, shop_name: e.target.value})} 
                        placeholder="e.g. Lawson"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <DollarSign size={16} className="text-red-500" />
                        Total Price (¥)
                      </label>
                      <div className="relative flex items-center border-b-2 border-red-500 pb-2">
                        <span className="text-xl font-bold text-slate-400 mr-2">¥</span>
                        <input 
                          className="w-full border-0 bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:text-slate-400" 
                          type="number"
                          value={result.total_price} 
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setResult({
                              ...result, 
                              total_price: val,
                              items: [{ name: 'Receipt total', price: val }]
                            })
                          }} 
                          placeholder="e.g. 1500"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                          <Calendar size={16} className="text-red-500" />
                          Date
                        </label>
                        <input 
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-slate-900 font-bold" 
                          type="date" 
                          value={result.date} 
                          onChange={(e) => setResult({...result, date: e.target.value})} 
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                          <Tag size={16} className="text-red-500" />
                          Category
                        </label>
                        <input 
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-slate-900 font-bold" 
                          value={result.category} 
                          onChange={(e) => setResult({...result, category: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        <FileText size={16} className="text-red-500" />
                        Items Detected
                      </label>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        {result.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm font-bold text-slate-700">
                            <span>{item.name}</span>
                            <span className="text-slate-950">¥{item.price.toLocaleString()}</span>
                          </div>
                        ))}

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-extrabold text-base text-slate-900">
                          <span>Total Spending</span>
                          <span className="text-red-600 font-black">¥{result.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deduct from Savings Goal */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-500 block">💰 Deduct from Savings Goal (Optional)</label>
                      <select
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none text-slate-900 font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ef4444%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.8rem_auto]"
                        value={selectedTarget}
                        onChange={e => setSelectedTarget(e.target.value)}
                      >
                        <option value="">Don't connect to savings goal</option>
                        {targets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} (¥{parseInt(t.current_amount || 0).toLocaleString()} / ¥{parseInt(t.target_amount || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                      {selectedTarget && (
                        <div className="flex items-center gap-2 p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-semibold">
                          <Info size={14} className="flex-shrink-0" />
                          <span>This expense will be deducted from your selected savings goal.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button
                        className="px-6 py-3.5 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex-1 flex items-center justify-center gap-2"
                        onClick={() => {
                          setImage(null)
                          setResult(null)
                          setSelectedTarget('')
                        }}
                        disabled={saving}
                      >
                        <X size={18} />
                        Cancel
                      </button>

                      <button
                        className="px-8 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_8px_16px_rgba(239,68,68,0.25)] transition-all active:scale-95 flex-1 flex items-center justify-center gap-2"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Recording...' : (
                          <>
                            <Check size={18} />
                            Record Expense & Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={20} color="#EF4444" />
            Receipt History
          </h3>
        </div>

        {receipts.length === 0 ? (
          <div style={{ padding: 24, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center' }}>
            No scanned receipts yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {receipts.map((receipt) => (
              <div key={receipt.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: 14, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#fff' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {receipt.shop_name || 'Unknown Shop'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                    {receipt.receipt_date || receipt.created_at?.slice(0, 10)} · {receipt.category || 'Shopping'}
                  </div>
                  {Array.isArray(receipt.items) && receipt.items.length > 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 650, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {receipt.items.map(item => item.name).join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 950, color: '#EF4444', whiteSpace: 'nowrap' }}>
                  ¥{Number(receipt.total_price || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
