import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  Plus,
  Lightbulb,
  Flame,
  ChevronLeft,
  Star,
  RotateCw,
  Camera,
  ScanLine,
  Calendar,
} from "lucide-react";
import {
  dashboard as dashboardApi,
  transactions as txApi,
  avatars as avatarApi,
  user as userApi,
  targets as targetApi,
  calendar as calendarApi,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { realOCR } from "./ReceiptScanner.jsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import catIdle from "../assets/pets/cat_idle.png";
import catHappy from "../assets/pets/cat_happy.png";
import catSad from "../assets/pets/cat_sad.png";
import catAngry from "../assets/pets/cat_angry.png";
import catDirty from "../assets/pets/cat_dirty.png";
import catCelebrate from "../assets/pets/cat_celebrate.png";

const avatarEmojis = {
  dog: "🐕",
  cat: "🐈",
  tree: "🌳",
  bird: "🐦",
  rabbit: "🐇",
};
const moodEmojis = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  dirty: "😷",
  celebrating: "🥳",
};

const careActions = [
  { id: "play", icon: "🎾", title: "Play", effect: "+10 Happiness" },
  { id: "feed", icon: "🍖", title: "Feed", effect: "+10 Fullness" },
  { id: "rest", icon: "🛏️", title: "Rest", effect: "+10 Energy" },
  { id: "shower", icon: "🚿", title: "Shower", effect: "+5 Happiness" },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [animatingPet, setAnimatingPet] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAmount, setSaveAmount] = useState("");
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionCategory, setTransactionCategory] = useState("General");
  const [transactionNote, setTransactionNote] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      showToast("Scanning receipt via AI...", "success");
      const result = await realOCR(file);
      setSaveAmount(result.total_price.toString());
      setTransactionCategory(result.category || "Shopping");
      setTransactionNote(result.shop_name || "Quick Save");
      setTransactionType("withdrawal"); // Receipts are usually expenses
      showToast(`Scanned! ¥${result.total_price} at ${result.shop_name}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to scan receipt", "error");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const target = data?.activeTarget;
  const progress = target?.progress || 0;
  const quickSaveDate = new Date().toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const quickSaveOverlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(15, 23, 42, 0.42)",
    backdropFilter: "blur(6px)",
  };
  const quickSaveSheetStyle = {
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    borderRadius: 28,
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
    color: "#1f2937",
    boxShadow: "0 28px 70px rgba(15, 23, 42, 0.18)",
  };

  const getPetImage = () => {
    if (!target) return catIdle;

    if (target.progress >= 100) return catCelebrate;

    if (target.cleanliness < 30) return catDirty;

    if (target.happiness < 20) return catSad;

    if (target.energy < 20) return catAngry;

    if (target.progress >= 50) return catHappy;

    return catIdle;
  };

  const getPetMoodClass = () => {
    const progress = target?.progress || 0;

    if (progress >= 100) return "pet-celebrate";
    if (progress >= 80) return "pet-excited";
    if (progress >= 50) return "pet-happy";
    if (progress >= 20) return "pet-normal";

    return "pet-sad";
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, calendarRes] = await Promise.all([
        dashboardApi.get(),
        calendarApi.get(),
      ]);

      setData(dashboardRes.data);
      
      if (calendarRes.data) {
        const formattedData = calendarRes.data.map(item => ({
          date: new Date(item.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: parseFloat(item.total)
        }));
        setCalendarData(formattedData);
      }

      setLoading(false);
    } catch (err) {
      showToast("Failed to load dashboard", "error");
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTransaction = async (type, transactionAmount = "") => {
    if (!transactionAmount || !data?.activeTarget) return false;
    const numAmount = parseFloat(transactionAmount);
    if (numAmount <= 0) return false;

    try {
      const res = await txApi.create({
        target_id: data.activeTarget.id,
        amount: numAmount,
        type,
        category: transactionCategory,
        note: transactionNote ? `${transactionCategory} · ${transactionNote}` : `${transactionCategory} · ${
          type === "deposit" ? "Daily savings" : "Expense deduction"
        }`,
        date: new Date().toISOString().split("T")[0],
      });

      setAnimatingPet(true);
      setTimeout(() => setAnimatingPet(false), 1000);

      showToast(
        type === "deposit"
          ? `Saved ¥${numAmount.toLocaleString()}! 🎉`
          : `Deducted ¥${numAmount.toLocaleString()}`,
      );

      setData((prev) => ({
        ...prev,
        activeTarget: {
          ...prev.activeTarget,
          current_amount: res.data.new_amount,
          progress: res.data.progress,
          status: res.data.status,
          mood: res.data.mood,
          happiness:
            type === "deposit"
              ? Math.min(100, prev.activeTarget.happiness + 5)
              : Math.max(0, prev.activeTarget.happiness - 5),
        },
      }));

      if (res.data.status === "completed") {
        showToast("🎉 Goal completed! You earned coins!");
        const currentCoins = user?.coins || parseInt(JSON.parse(localStorage.getItem('user'))?.coins) || 0;
        updateUser({
          coins: currentCoins + Math.floor(data.activeTarget.target_amount / 100),
        });
      }

      loadDashboard();
      return true;
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
      return false;
    }
  };

  const handleCare = async (action) => {
    if (!data?.activeTarget) return;
    try {
      await avatarApi.care({
        target_id: data.activeTarget.id,
        action: action.id,
      });
      showToast(`${action.title} completed! ✨`);
      loadDashboard();
    } catch (err) {
      showToast("Care action failed", "error");
    }
  };

  const handleQuickSave = async () => {
    setShowSaveModal(true);
    setSaveAmount("");
    setTransactionType("withdrawal");
    setTransactionCategory("General");
  };

  const submitQuickSave = async (e) => {
    e.preventDefault();
    const saved = await handleTransaction(transactionType, saveAmount.trim());
    if (saved) {
      setShowSaveModal(false);
      setSaveAmount("");
      setTransactionNote("");
    }
  };

  const changeGoal = async (goalId) => {
    try {
      await userApi.setActiveTarget(goalId);

      await loadDashboard();

      showToast("Goal changed successfully!");
    } catch (err) {
      showToast("Failed to change goal", "error");
    }
  };

  if (loading)
    return (
      <div className="loading-screen">
        <div className="loading-paw">🐾</div>
      </div>
    );

  return (
    <div className="animate-fade-in">
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast ${toast.type}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header">
        <div className="page-title">
          <h2>Hello, Saver! 👋</h2>
          <p>Take care of your pet and reach your goals!</p>
        </div>
        <div className="header-actions">
          <div className="streak-badge">
            <Flame size={20} />
            <span>{data?.user?.streak_days || 0} Day Streak</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* CONGRATULATIONS BANNER */}
          {target && target.status === 'completed' && (
            <motion.div 
              className="card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: '2px solid #10b981',
                textAlign: 'center',
                marginBottom: 20
              }}
            >
              <h3 style={{ fontSize: 24, color: '#047857', marginBottom: 8 }}>🎉 Congratulations! 🎉</h3>
              <p style={{ color: '#059669', fontWeight: 600, marginBottom: 16 }}>
                You have successfully reached your goal! Any extra money you save now will automatically roll over to your next goal.
              </p>
              <button 
                className="btn btn-primary"
                style={{ background: '#059669', border: 'none' }}
                onClick={() => navigate('/goals')}
              >
                Start New Goal
              </button>
            </motion.div>
          )}

          {/* PET CARD */}
          {target ? (
            <motion.div
              className="pet-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="pet-info">
                <div className="pet-avatar-img">
                  {avatarEmojis[target.avatar_type] || "🐕"}
                </div>

                <div className="pet-name">
                  <h3>
                    {target.avatar_name}
                    <Edit3
                      size={14}
                      style={{ cursor: "pointer", opacity: 0.5 }}
                    />
                  </h3>

                  <p>
                    Happy{" "}
                    {target.avatar_type.charAt(0).toUpperCase() +
                      target.avatar_type.slice(1)}
                    • Level {target.level}
                  </p>

                  <div className="pet-message">
                    {target.progress < 20
                      ? "😢 Please save some money..."
                      : target.progress < 50
                        ? "🙂 Keep going!"
                        : target.progress < 80
                          ? "😊 You're doing great!"
                          : target.progress < 100
                            ? "🤩 Almost there!"
                            : "🎉 Goal completed!"}
                  </div>
                </div>
                <div className={`pet-mood ${target.mood}`}>
                  <span>{moodEmojis[target.mood] || "😐"}</span>
                  <span>
                    {target.mood.charAt(0).toUpperCase() + target.mood.slice(1)}
                  </span>
                </div>
              </div>

              <div className="pet-scene">
                <motion.img
                  src={getPetImage()}
                  alt="Pet"
                  className="pet-character-img"
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <div className="pet-stats">
                <div className="pet-stat">
                  <div className="pet-stat-icon happiness">😊</div>
                  <div className="pet-stat-bar">
                    <div
                      className="pet-stat-fill happiness"
                      style={{ width: `${target.happiness}%` }}
                    />
                  </div>
                  <span className="pet-stat-value">{target.happiness}/100</span>
                </div>
                <div className="pet-stat">
                  <div className="pet-stat-icon energy">⚡</div>
                  <div className="pet-stat-bar">
                    <div
                      className="pet-stat-fill energy"
                      style={{ width: `${target.energy}%` }}
                    />
                  </div>
                  <span className="pet-stat-value">{target.energy}/100</span>
                </div>
                <div className="pet-stat">
                  <div className="pet-stat-icon fullness">🥣</div>
                  <div className="pet-stat-bar">
                    <div
                      className="pet-stat-fill fullness"
                      style={{ width: `${target.fullness}%` }}
                    />
                  </div>
                  <span className="pet-stat-value">{target.fullness}/100</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h3 style={{ marginBottom: 8 }}>No Active Goal</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                Create your first savings goal to get a pet!
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/goals")}
              >
                Create Goal
              </button>
            </div>
          )}

          {/* TRANSACTION INPUT */}
          {target && (
            <motion.button
              type="button"
              className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_18px_40px_rgba(74,222,128,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-600 md:bottom-8 md:right-8"
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleQuickSave}
              aria-label="Open quick save"
            >
              <Plus size={24} />
            </motion.button>
          )}

          <AnimatePresence>
            {showSaveModal && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                style={quickSaveOverlayStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSaveModal(false)}
              >
                <motion.div
                  className={`w-full max-w-[420px] overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_28px_70px_rgba(15,23,42,0.18)] ${
                    transactionType === "withdrawal"
                      ? "ring-1 ring-rose-200"
                      : "ring-1 ring-emerald-100"
                  }`}
                  style={quickSaveSheetStyle}
                  initial={{ scale: 0.94, y: 18 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.94, y: 18 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"
                    style={{
                      borderBottom: "1px solid #e5e7eb",
                      padding: "16px 20px",
                    }}
                  >
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        background: "#f3f4f6",
                        border: "none",
                        color: "#4b5563",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => setShowSaveModal(false)}
                      aria-label="Back"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex-1 text-center">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">
                        {transactionType === "withdrawal"
                          ? "Expense"
                          : "Income"}
                      </span>
                      <h3 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
                        {transactionType === "withdrawal"
                          ? "Quick Expense"
                          : "Quick Save"}
                      </h3>
                    </div>

                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 9999,
                        background: "#f3f4f6",
                        border: "none",
                        color: "#4b5563",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => setShowSaveModal(false)}
                      aria-label="Favorite"
                    >
                      <Star size={18} />
                    </button>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 px-5 pt-5"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: 8,
                      padding: "20px 20px 0",
                    }}
                    role="tablist"
                    aria-label="Transaction type"
                  >
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        transactionType === "deposit"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                      style={{
                        borderRadius: 12,
                        border:
                          transactionType === "deposit"
                            ? "1px solid #10b981"
                            : "1px solid #e5e7eb",
                        background:
                          transactionType === "deposit" ? "#ecfdf5" : "#ffffff",
                        color:
                          transactionType === "deposit" ? "#047857" : "#6b7280",
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                      onClick={() => setTransactionType("deposit")}
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        transactionType === "withdrawal"
                          ? "border-rose-500 bg-rose-50 text-rose-600"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                      style={{
                        borderRadius: 12,
                        border:
                          transactionType === "withdrawal"
                            ? "1px solid #f43f5e"
                            : "1px solid #e5e7eb",
                        background:
                          transactionType === "withdrawal"
                            ? "#fff1f2"
                            : "#ffffff",
                        color:
                          transactionType === "withdrawal"
                            ? "#e11d48"
                            : "#6b7280",
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                      onClick={() => setTransactionType("withdrawal")}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-300"
                      style={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        color: "#cbd5e1",
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                      disabled
                    >
                      Transfer
                    </button>
                  </div>

                  <div
                    className="mx-5 mt-4 flex items-center justify-between border-b border-slate-200 pb-3"
                    style={{
                      margin: "16px 20px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-400">
                        Date
                      </div>
                      <div
                        className="text-sm font-bold text-slate-900"
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {quickSaveDate}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        color: "#9ca3af",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      aria-label="Refresh date"
                    >
                      <RotateCw size={16} />
                      <span>Rep/Inst.</span>
                    </button>
                  </div>

                  <form
                    className="flex flex-col gap-4 px-5 py-4"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      padding: "16px 20px 20px",
                    }}
                    onSubmit={submitQuickSave}
                  >
                    <div className="space-y-2">
                      <label
                        className="text-sm font-bold text-slate-500"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Amount (¥)
                      </label>
                      <div
                        className="flex items-center gap-3 border-b-2 border-emerald-500 pb-2"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          borderBottom: "2px solid #10b981",
                          paddingBottom: 8,
                        }}
                      >
                        <span
                          className="text-xl font-bold text-slate-400"
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#9ca3af",
                          }}
                        >
                          ¥
                        </span>
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          className="w-full border-0 bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:text-slate-400"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                          value={saveAmount}
                          onChange={(e) => setSaveAmount(e.target.value)}
                          placeholder="0"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-bold text-slate-500"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Category
                      </label>
                      <select
                        className="form-input"
                        style={{
                          width: "100%",
                          borderRadius: 16,
                          background: "#f8fafc",
                        }}
                        value={transactionCategory}
                        onChange={(e) => setTransactionCategory(e.target.value)}
                      >
                        <option value="General">General</option>
                        <option value="Food">Food</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Transport">Transport</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleReceiptUpload}
                    />
                    <div
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-500 cursor-pointer hover:bg-slate-50 transition"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: 16,
                        border: "1px solid #e5e7eb",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                      onClick={() => !isScanning && fileInputRef.current?.click()}
                    >
                      <span>
                        {isScanning
                          ? "Scanning receipt..."
                          : transactionNote || "Scan Receipt (Auto-fill)"}
                      </span>
                      {isScanning ? (
                        <ScanLine size={16} className="text-emerald-500 animate-pulse" />
                      ) : (
                        <Camera size={16} className="text-slate-400" />
                      )}
                    </div>

                    <div
                      className="grid grid-cols-[1.6fr_1fr] gap-3 pt-1"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.6fr 1fr",
                        gap: 12,
                        paddingTop: 4,
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          minHeight: 48,
                          borderRadius: 16,
                          border: "none",
                          background: "#4ade80",
                          color: "#ffffff",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                        disabled={!saveAmount}
                      >
                        {transactionType === "withdrawal" ? "Use" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        style={{
                          minHeight: 48,
                          borderRadius: 16,
                          border: "1px solid #e5e7eb",
                          background: "#ffffff",
                          color: "#374151",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                        onClick={() => setShowSaveModal(false)}
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DAILY SPENDING CHART */}
          {calendarData.length > 0 && (
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={20} color="#EF4444" />
                  Daily Spending
                </h3>
              </div>
              <div style={{ height: 250, width: '100%', marginTop: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calendarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `¥${value}`} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `¥${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* CARE ACTIONS */}
          {target && (
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card-header">
                <h3 className="card-title">
                  Take Care of {target.avatar_name}
                </h3>
              </div>
              <div className="care-grid">
                {careActions.map((action) => (
                  <motion.button
                    key={action.id}
                    className="care-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCare(action)}
                  >
                    <span className="care-btn-icon">{action.icon}</span>
                    <span className="care-btn-title">{action.title}</span>
                    <span className="care-btn-effect">{action.effect}</span>
                  </motion.button>
                ))}
              </div>
              <p
                style={{
                  textAlign: "center",
                  marginTop: 16,
                  color: "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                🗓️ Come back tomorrow for more activities!
              </p>
            </motion.div>
          )}

          {/* ACHIEVEMENTS */}
          <motion.div
            className="card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="card-header">
              <h3 className="card-title">🏆 Achievements</h3>
              <button
                className="card-action"
                onClick={() => navigate("/achievements")}
              >
                View All
              </button>
            </div>
            <div
              className="achievement-grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              }}
            >
              {data?.achievements?.slice(0, 4).map((ach) => (
                <div
                  key={ach.id}
                  className={`achievement-card ${ach.is_unlocked ? "unlocked" : ""}`}
                >
                  <div className={`achievement-icon ${ach.tier}`}>
                    {ach.is_unlocked ? "✅" : "🔒"}
                  </div>
                  <div className="achievement-info">
                    <div className="achievement-title">{ach.title}</div>
                    <div className="achievement-desc">{ach.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="dashboard-side">
          {/* CURRENT GOAL */}
          {target && (
            <motion.div
              className="goal-card"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card-header">
                <h3 className="card-title">Current Goal</h3>
                <button
                  className="card-action"
                  onClick={() => navigate("/goals")}
                >
                  Edit Goal
                </button>
              </div>

              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div className="goal-image">🎮</div>
                <div className="goal-info">
                  <h4>{target.name}</h4>
                  <div className="goal-amount">
                    ¥ {parseInt(target.target_amount).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="goal-progress-section">
                <div className="goal-progress-bar">
                  <motion.div
                    className="goal-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="goal-meta">
                  <span>
                    Saved: ¥{parseInt(target.current_amount).toLocaleString()} /
                    ¥{parseInt(target.target_amount).toLocaleString()}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                {target.deadline && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    ⏰{" "}
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(target.deadline) - new Date()) / 86400000,
                      ),
                    )}{" "}
                    days left
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PET STATUS */}
          {target && (
            <motion.div
              className="card"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="card-title" style={{ marginBottom: 16 }}>
                Pet Status
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {["happiness", "energy", "fullness"].map((stat) => (
                  <div
                    key={stat}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ fontSize: 20 }}>
                      {stat === "happiness"
                        ? "😊"
                        : stat === "energy"
                          ? "⚡"
                          : "🥣"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            textTransform: "capitalize",
                          }}
                        >
                          {stat}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {target[stat]} / 100
                        </span>
                      </div>
                      <div className="goal-progress-bar" style={{ height: 8 }}>
                        <div
                          className="goal-progress-fill"
                          style={{
                            width: `${target[stat]}%`,
                            background:
                              stat === "happiness"
                                ? "var(--accent-green)"
                                : stat === "energy"
                                  ? "var(--accent-yellow)"
                                  : "var(--accent-blue)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TIP */}
          <motion.div
            className="card"
            style={{
              background: "var(--accent-yellow-light)",
              borderColor: "#FEF08A",
            }}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Lightbulb
                size={24}
                style={{ color: "var(--accent-yellow)", flexShrink: 0 }}
              />
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                Tip: Keep your pet happy by saving money and completing
                challenges!
              </p>
            </div>
          </motion.div>

          {/* SHOP PREVIEW */}
          <motion.div
            className="card"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="card-header">
              <h3 className="card-title">Shop</h3>
              <button className="card-action" onClick={() => navigate("/shop")}>
                View All
              </button>
            </div>
            <div
              className="shop-grid"
              style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
            >
              {data?.shopPreview?.map((item) => (
                <div key={item.id} className="shop-item">
                  <span className="shop-item-icon">{item.icon}</span>
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-price">🪙 {item.price}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "var(--accent-yellow-light)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                🪙 Earn coins by saving and completing challenges!
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
