import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, ScanLine, Check, X, Sparkles, FileText, Store, DollarSign, Calendar, Tag } from 'lucide-react'
import { receipts as receiptApi, targets as targetApi } from '../api.js'

// 1. Google Generative AI ကို Import လုပ်မယ်
import { GoogleGenerativeAI } from '@google/generative-ai'

// ⚠️ ခင်ဗျားရဲ့ လက်ရှိ API Key

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ဖိုင်ကို Gemini ဖတ်နိုင်တဲ့ Base64 format ပြောင်းပေးမယ့် helper function
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

// 503 (High Demand) Error အတွက် ခေတ္တ စောင့်ဆိုင်းပေးမယ့် Helper function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const realOCR = async (file) => {
  const today = new Date().toISOString().split('T')[0];
  const imagePart = await fileToGenerativePart(file);

  // စာဖတ်နှုန်း အရည်အသွေး ကောင်းမွန်စေရန် Model အသစ်နှင့် Schema သတ်မှတ်ချက်ကို သုံးထားပါတယ်
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "You are a professional financial auditor and highly accurate receipt parser. Analyze the provided image meticulously to extract information even if the image is slightly blurry or at an angle.",
    generationConfig: { 
      responseMimeType: "application/json",
      // Output Format တိကျပြီး Error မတက်စေရန် Schema ပိတ်ထားခြင်း
      responseSchema: {
        type: "object",
        properties: {
          shop_name: { type: "string", description: "Name of the shop or company" },
          total_price: { type: "integer", description: "The final total amount paid (numeric integer only)" },
          date: { type: "string", description: "Transaction date in YYYY-MM-DD format" }
        },
        required: ["shop_name", "total_price", "date"]
      }
    }
  });

  const prompt = `
    Analyze this receipt image step-by-step:
    1. Identify the official store name or merchant name (If in Japanese, keep it in Japanese).
    2. Scan for the final amount paid. Look for labels like "合計", "TOTAL", "小計", "Grand Total", "Bar", or the largest prominent number near the bottom.
    3. Find the transaction date. If the year is missing or truncated, assume the current year is 2026. Format as YYYY-MM-DD.
    
    Ensure extreme accuracy for numbers and characters.
  `;

  // Server overloaded ဖြစ်ရင် ၃ ကြိမ်အထိ အလိုအလျောက် ပြန်ကြိုးစားမည့် စနစ် (Exponential Backoff Retry)
  let maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await model.generateContent([prompt, imagePart]);
      const resultText = response.response.text();
      const aiParsed = JSON.parse(resultText);

      return {
        shop_name: aiParsed.shop_name || 'Unknown Shop',
        total_price: Number(aiParsed.total_price) || 0,
        date: aiParsed.date || today,
        category: 'Shopping',
        items: [{ name: 'お会計 / 合計', price: Number(aiParsed.total_price) || 0 }],
        confidence: 100 
      };

    } catch (err) {
      attempt++;
      console.warn(`Attempt ${attempt} failed. Error: ${err.message}`);
      
      // အကယ်၍ 503 Overloaded Error ဖြစ်ခဲ့လျှင် ခေတ္တ စောင့်ပြီး ပြန်ကြိုးစားမည်
      if ((err.message?.includes('503') || err.message?.includes('demand')) && attempt < maxRetries) {
        await delay(attempt * 2000); // 1st try: 2s, 2nd try: 4s
        continue;
      }

      // တကယ်လို့ retry လုပ်လို့မှ မရတော့ရင် အောက်က default တန်ဖိုးကို ပြန်ပေးမယ်
      console.error("Gemini Image Parsing Final Error:", err);
      alert("AI parsing is temporarily unavailable due to high server traffic. Please try again in a few moments.");
      
      return {
        shop_name: 'Unknown Shop',
        total_price: 0,
        date: today,
        category: 'Shopping',
        items: [{ name: 'お会計 / 合計', price: 0 }],
        confidence: 31 
      };
    }
  }
};

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
    targetApi.list('active')
      .then(res => setTargets(res.data || []))
      .catch(err => console.error(err))
  }, [])

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
      alert('OCR failed')
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
      await receiptApi.create({
        shop_name: result.shop_name,
        total_price: result.total_price,
        date: result.date,
        category: result.category,
        items: result.items,
        target_id: selectedTarget || null,
        image_path: image
      })

      alert(`Receipt saved! ¥${result.total_price.toLocaleString()} added!`)
      setImage(null)
      setResult(null)
      setSelectedTarget('')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

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
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 16,
                      padding: 12,
                      background: result.confidence === 100 ? 'var(--accent-green-light)' : '#ffebee',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <Check size={20} color={result.confidence === 100 ? "var(--accent-green)" : "red"} />
                    <span style={{ fontWeight: 700, color: result.confidence === 100 ? 'var(--accent-green)' : 'red' }}>
                      {result.confidence === 100 ? `Detected via Gemini AI (Confidence: ${result.confidence}%)` : "AI Parsing Failed. Using Default Values."}
                    </span>
                  </div>

                  <div className="scanner-form">
                    <div className="form-group">
                      <label>
                        <Store size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Shop Name
                      </label>
                      <input 
                        className="form-input" 
                        value={result.shop_name} 
                        onChange={(e) => setResult({...result, shop_name: e.target.value})} 
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <DollarSign size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Total Price (¥)
                      </label>
                      <input 
                        className="form-input" 
                        type="number"
                        value={result.total_price} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setResult({
                            ...result, 
                            total_price: val,
                            items: [{ name: 'お会計 / 合計', price: val }]
                          })
                        }} 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group">
                        <label>
                          <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                          Date
                        </label>
                        <input 
                          className="form-input" 
                          type="date" 
                          value={result.date} 
                          onChange={(e) => setResult({...result, date: e.target.value})} 
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Tag size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                          Category
                        </label>
                        <input 
                          className="form-input" 
                          value={result.category} 
                          onChange={(e) => setResult({...result, category: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        Items Detected
                      </label>

                      <div
                        style={{
                          background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }}
                      >
                        {result.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{item.name}</span>
                            <span>¥{item.price.toLocaleString()}</span>
                          </div>
                        ))}

                        <div
                          style={{
                            borderTop: '1px solid var(--border-color)',
                            marginTop: 4,
                            paddingTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 800
                          }}
                        >
                          <span>Total</span>
                          <span>¥{result.total_price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>💰 Add to Savings Goal (Optional)</label>
                      <select
                        className="form-input"
                        value={selectedTarget}
                        onChange={e => setSelectedTarget(e.target.value)}
                      >
                        <option value="">Don't add to goal</option>
                        {targets.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} (¥{parseInt(t.current_amount || 0).toLocaleString()} / ¥{parseInt(t.target_amount || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
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
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : (
                          <>
                            <Check size={18} />
                            Save Receipt
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
    </div>
  )
}