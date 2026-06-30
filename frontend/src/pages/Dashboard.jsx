import React, { useState, useEffect, useMemo, useRef } from "react";
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
  AlertTriangle,
  Trash2,
  Trophy,
  Award,
  PiggyBank,
  MessageCircle,
  Gift,
  CheckCircle2,
} from "lucide-react";
import {
  dashboard as dashboardApi,
  dailyQuests as dailyQuestApi,
  transactions as txApi,
  avatars as avatarApi,
  user as userApi,
  targets as targetApi,
  calendar as calendarApi,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../i18n.jsx";
import { realOCR } from "./ReceiptScanner.jsx";
import { avatarEmojis, avatarTypes, getPetImageForTarget } from "../petAssets.js";

const moodEmojis = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  celebrating: "🥳",
};

const getMoodFromProgress = (progress = 0) => {
  if (progress >= 100) return "celebrating";
  if (progress >= 70) return "happy";
  if (progress >= 40) return "neutral";
  return "sad";
};

const formatDateKey = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const money = (amount = 0) => `¥${Number(amount || 0).toLocaleString()}`;

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
  const [petReaction, setPetReaction] = useState(null);
  const [conversationIndex, setConversationIndex] = useState(0);
  const [animatingPet, setAnimatingPet] = useState(false);
  const [petPointer, setPetPointer] = useState({ x: 0, y: 0 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAmount, setSaveAmount] = useState("");
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionCategory, setTransactionCategory] = useState("General");
  const [transactionNote, setTransactionNote] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [deletingExpiredGoal, setDeletingExpiredGoal] = useState(false);
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();
  const { language } = useLanguage();
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
  const dailyQuests = data?.dailyQuests || [];
  const petConversation = data?.petConversation;
  const conversationMessages = petConversation?.messages || [];
  const currentConversation = conversationMessages.length
    ? conversationMessages[conversationIndex % conversationMessages.length]
    : "Every small money step matters. I am here with you.";
  const progress = target?.progress || 0;
  const deadlineEnd = target?.deadline
    ? new Date(`${target.deadline}T23:59:59`)
    : null;
  const daysUntilDeadline = target?.deadline
    ? Math.ceil((deadlineEnd - new Date()) / 86400000)
    : null;
  const showExpiredGoal =
    target && deadlineEnd && progress < 100 && deadlineEnd < new Date();
  const showDeadlineWarning =
    target && !showExpiredGoal && target.deadline && progress < 100 && daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
  const careActionsRemaining = target?.care_actions_remaining ?? 3;
  const careLimitReached = careActionsRemaining <= 0;
  const todayKey = new Date().toISOString().split("T")[0];
  const savedToday = (data?.transactions || []).some((tx) => (
    tx.type === "deposit" &&
    String(tx.transaction_date || "").slice(0, 10) === todayKey
  ));
  const targetRemaining = target
    ? Math.max(0, Number(target.target_amount || 0) - Number(target.current_amount || 0))
    : 0;
  const petSavingAmount = targetRemaining > 0
    ? Math.max(100, Math.min(500, Math.ceil(targetRemaining / 10)))
    : 100;
  const petMood = getMoodFromProgress(progress);
  const shopPreview = (data?.shopPreview || []).filter(item => !['glasses', 'scarf'].includes(item.category));
  const getShopPreviewIcon = (item) => {
    if (item.avatar_type) return avatarTypes.find(type => type.id === item.avatar_type)?.emoji || item.icon;
    return item.icon;
  };
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

  const calendarMonthLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [],
  );

  const calendarCells = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(now);
    const totalsByDay = new Map(
      calendarData.map((item) => [
        item.day,
        {
          income: Number(item.income || 0),
          expense: Number(item.expense || 0),
        },
      ]),
    );

    const emptyCells = Array.from({ length: firstDay.getDay() }, (_, index) => ({
      key: `empty-${index}`,
      isEmpty: true,
    }));

    const dayCells = Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const key = formatDateKey(new Date(year, month, dayNumber));
      const totals = totalsByDay.get(key) || { income: 0, expense: 0 };

      return {
        key,
        dayNumber,
        income: totals.income,
        expense: totals.expense,
        isToday: key === todayKey,
      };
    });

    return [...emptyCells, ...dayCells];
  }, [calendarData]);

  const handlePetPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    setPetPointer({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const getPetImage = () => {
    return getPetImageForTarget(target);
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
        const formattedData = calendarRes.data.map((item) => ({
          day: item.day,
          income: Number(item.income || 0),
          expense: Number(item.expense || 0),
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

  const showPetReaction = (reaction) => {
    if (!reaction) return;
    setPetReaction(reaction);
    setAnimatingPet(true);
    setTimeout(() => setAnimatingPet(false), 1000);
  };

  const handleTransaction = async (type, transactionAmount = "") => {
    if (!transactionAmount) return false;
    const numAmount = parseFloat(transactionAmount);
    if (numAmount <= 0) return false;

    try {
      const res = await txApi.create({
        target_id: type === "deposit" && data?.activeTarget ? data.activeTarget.id : null,
        amount: numAmount,
        type,
        category: transactionCategory,
        note: transactionNote ? `${transactionCategory} · ${transactionNote}` : `${transactionCategory} · ${
          type === "deposit" ? "Daily savings" : "Expense deduction"
        }`,
        date: new Date().toISOString().split("T")[0],
      });

      showPetReaction(res.data?.pet_reaction);

      setAnimatingPet(true);
      setTimeout(() => setAnimatingPet(false), 1000);
      showToast(
        type === "deposit"
          ? `Saved ¥${numAmount.toLocaleString()}! 🎉`
          : `Deducted ¥${numAmount.toLocaleString()}`,
      );

      if (type === "deposit" && data?.activeTarget) {
        setData((prev) => ({
          ...prev,
          activeTarget: {
            ...prev.activeTarget,
            current_amount: res.data.new_amount,
            progress: res.data.progress,
            status: res.data.status,
            mood: res.data.mood,
            happiness: res.data?.pet_reaction?.happiness ?? prev.activeTarget.happiness,
            level: res.data?.pet_reaction?.level ?? prev.activeTarget.level,
            exp: res.data?.pet_reaction?.exp ?? prev.activeTarget.exp,
          },
        }));

        if (res.data.status === "completed") {
          showToast("🎉 Goal completed! You earned coins!");
          const currentCoins = user?.coins || parseInt(JSON.parse(localStorage.getItem('user'))?.coins) || 0;
          updateUser({
            coins: currentCoins + Math.floor(data.activeTarget.target_amount / 100),
          });
        }
      }

      loadDashboard();
      return true;
    } catch (err) {
      showToast(err.message || "Transaction failed", "error");
      return false;
    }
  };

  const handlePetSavingMission = async () => {
    if (!data?.activeTarget) return;

    try {
      const res = await txApi.create({
        target_id: data.activeTarget.id,
        amount: petSavingAmount,
        type: "deposit",
        category: "Pet Saving",
        note: `Pet Saving • Daily mission for ${data.activeTarget.avatar_name || data.activeTarget.name}`,
        date: new Date().toISOString().split("T")[0],
      });

      showPetReaction(res.data?.pet_reaction);
      showToast(`Pet mission complete! Saved ¥${petSavingAmount.toLocaleString()} for ${data.activeTarget.avatar_name}.`);
      loadDashboard();
    } catch (err) {
      showToast(err.message || "Pet saving mission failed", "error");
    }
  };

  const handleCare = async (action) => {
    if (!data?.activeTarget) return;
    if (careLimitReached) {
      showToast("You can take care of your avatar only 3 times per day.", "error");
      return;
    }
    try {
      const res = await avatarApi.care({
        target_id: data.activeTarget.id,
        action: action.id,
      });
      showPetReaction({
        emoji: action.icon,
        message: `${data.activeTarget.avatar_name} enjoyed ${action.title.toLowerCase()} time!`,
        exp_gain: 10,
        happiness_gain: action.id === "play" ? 10 : action.id === "shower" ? 5 : 0,
      });
      showToast(`${action.title} completed! ✨`);
      setData((prev) => ({
        ...prev,
        activeTarget: {
          ...prev.activeTarget,
          care_actions_today: res.data.care_actions_today,
          care_actions_remaining: res.data.care_actions_remaining,
          level: res.data.level,
          exp: res.data.exp,
          ...res.data.stats,
        },
      }));
      loadDashboard();
    } catch (err) {
      showToast(err.message || "Care action failed", "error");
    }
  };
  const handleClaimDailyQuest = async (questId) => {
    try {
      const res = await dailyQuestApi.claim(questId);
      const coinsEarned = Number(res.data?.coins || 0);
      setData((prev) => ({
        ...prev,
        dailyQuests: res.data?.quests || prev.dailyQuests,
        user: {
          ...prev.user,
          coins: Number(prev.user?.coins || 0) + coinsEarned,
        },
      }));
      updateUser({ coins: Number(user?.coins || 0) + coinsEarned });
      showPetReaction(res.data?.pet_reaction);
      showToast(`Daily quest complete! +${coinsEarned} coins`);
    } catch (err) {
      showToast(err.message || "Failed to claim daily quest", "error");
    }
  };

  const deleteExpiredGoal = async () => {
    if (!target || deletingExpiredGoal) return;
    setDeletingExpiredGoal(true);
    try {
      await targetApi.delete(target.id);
      setData((prev) => ({ ...prev, activeTarget: null }));
      showToast("The expired goal was deleted.");
    } catch (err) {
      showToast(err.message || "Failed to delete expired goal", "error");
    } finally {
      setDeletingExpiredGoal(false);
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

      <AnimatePresence>
        {showExpiredGoal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="failure-modal"
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
            >
              <div className="failure-modal-icon">
                <AlertTriangle size={34} />
              </div>
              <h3>You tried your best</h3>
              <p>
                Somehow the deadline passed before <strong>{target.name}</strong> was completed.
                Delete this target and start again with a new goal.
              </p>
              <button
                type="button"
                className="btn btn-danger"
                onClick={deleteExpiredGoal}
                disabled={deletingExpiredGoal}
              >
                <Trash2 size={17} />
                {deletingExpiredGoal ? "Deleting..." : "Delete failed target"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeadlineWarning && (
          <motion.div
            className="deadline-warning"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
          >
            <div className="deadline-warning-icon">⏰</div>
            <div>
              <div className="deadline-warning-title">Deadline is near</div>
              <div className="deadline-warning-copy">
                {target.name} has {daysUntilDeadline === 0 ? 'less than 1 day' : `${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'}`} left.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-header">
        <div className="page-title">
          <h2>Hello, {user?.username || data?.user?.username || "Saver"}! 👋</h2>
          <p>Save toward your target and watch your pet react.</p>
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
              style={{
                "--spotlight-x": `${50 + petPointer.x * 28}%`,
                "--spotlight-y": `${45 + petPointer.y * 24}%`,
                "--pet-eye-x": `${petPointer.x * 4}px`,
                "--pet-eye-y": `${petPointer.y * 3}px`,
              }}
              onPointerMove={handlePetPointerMove}
              onPointerLeave={() => setPetPointer({ x: 0, y: 0 })}
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
                <div className={`pet-mood ${petMood}`}>
                  <span>{moodEmojis[petMood] || "😐"}</span>
                  <span>
                    {petMood.charAt(0).toUpperCase() + petMood.slice(1)}
                  </span>
                </div>
              </div>

              <div className="pet-scene" style={{ cursor: "pointer" }}>
                <motion.img
                  src={getPetImage()}
                  alt="Pet"
                  className="pet-character-img"
                  style={{
                    x: petPointer.x * 6,
                    y: petPointer.y * 4,
                    rotate: petPointer.x * 1.5,
                  }}
                  whileHover={{ y: -15, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    y: { type: "spring", stiffness: 300, damping: 12 },
                    scale: {
                      type: "spring",
                      stiffness: 300,
                      damping: 12,
                    },
                    default: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                />
                <div className="pet-follow-eyes" aria-hidden="true">
                  <span className="pet-follow-eye">
                    <span />
                  </span>
                  <span className="pet-follow-eye">
                    <span />
                  </span>
                </div>
              </div>

              <div className="pet-progress-strip">
                <div>
                  <span>Target progress</span>
                  <strong>{Math.round(progress)}%</strong>
                </div>
                <div className="pet-progress-track">
                  <div
                    className="pet-progress-fill"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              <div className="pet-bond-panel">
                <div className="pet-conversation-card">
                  <div className="pet-conversation-avatar">
                    <MessageCircle size={20} />
                  </div>
                  <div className="pet-conversation-copy">
                    <span>{target.avatar_name} says</span>
                    <p>{currentConversation}</p>
                  </div>
                  <button
                    type="button"
                    className="pet-talk-again"
                    onClick={() => setConversationIndex((index) => index + 1)}
                    disabled={conversationMessages.length <= 1}
                  >
                    <RotateCw size={14} /> Talk again
                  </button>
                </div>

                <div className="pet-level-row">
                  <div>
                    <strong>Bond Level {target.level || 1}</strong>
                    <span>{target.exp || 0}/{(target.level || 1) * 100} EXP</span>
                  </div>
                  <div className="pet-exp-bar" aria-label="Pet bond experience">
                    <motion.div
                      className="pet-exp-fill"
                      animate={{ width: `${Math.min(100, ((target.exp || 0) / ((target.level || 1) * 100)) * 100)}%` }}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {petReaction && (
                    <motion.div
                      key={`${petReaction.message}-${petReaction.exp}`}
                      className="pet-reaction-banner"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <span className="pet-reaction-emoji">{petReaction.emoji || "🐾"}</span>
                      <div>
                        <strong>{petReaction.message}</strong>
                        <small>
                          {petReaction.exp_gain ? `+${petReaction.exp_gain} EXP` : ""}
                          {petReaction.happiness_gain ? `  •  +${petReaction.happiness_gain} Happiness` : ""}
                        </small>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pet-care-heading">
                  <div>
                    <strong>Bond with {target.avatar_name}</strong>
                    <span>Care turns money progress into a daily relationship.</span>
                  </div>
                  <span className="care-count">{careActionsRemaining}/3 left</span>
                </div>

                <div className="care-grid">
                  {careActions.map((action) => (
                    <button
                      type="button"
                      className="care-btn"
                      key={action.id}
                      onClick={() => handleCare(action)}
                      disabled={careLimitReached}
                    >
                      <span className="care-btn-icon">{action.icon}</span>
                      <span className="care-btn-title">{action.title}</span>
                      <span className="care-btn-effect">{action.effect}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  border: "1px solid rgba(16, 185, 129, 0.22)",
                  borderRadius: 12,
                  background: savedToday
                    ? "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)"
                    : "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: savedToday ? "#047857" : "#c2410c", marginBottom: 4 }}>
                      {language === "ja" ? "本日のペット貯金ミッション" : "Today's Pet Saving Mission"}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                      {savedToday
                        ? language === "ja"
                          ? `${target.avatar_name}は今日の貯金でうれしそうです。`
                          : `${target.avatar_name} is happy with today's savings.`
                        : language === "ja"
                          ? `¥${petSavingAmount.toLocaleString()}を貯金して${target.avatar_name}を応援しましょう。`
                          : `Save ¥${petSavingAmount.toLocaleString()} to cheer up ${target.avatar_name}.`}
                    </div>
                  </div>
                  <div style={{ fontSize: 30 }}>{savedToday ? "🎉" : "🐾"}</div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePetSavingMission}
                  disabled={savedToday || target.status === "completed"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <PiggyBank size={18} />
                  {savedToday
                    ? language === "ja" ? "今日のミッション完了" : "Mission complete today"
                    : language === "ja" ? `¥${petSavingAmount.toLocaleString()} 貯金する` : `Save ¥${petSavingAmount.toLocaleString()}`}
                </button>
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

          <motion.div
            className="card finance-calendar-card"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-header">
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={20} color="#2563eb" />
                {calendarMonthLabel}
              </h3>
            </div>
            <div className="finance-calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="finance-calendar-grid">
              {calendarCells.map((cell) => (
                <div
                  key={cell.key}
                  className={`finance-calendar-day${cell.isEmpty ? " empty" : ""}${cell.isToday ? " today" : ""}`}
                >
                  {!cell.isEmpty && (
                    <>
                      <div className="finance-calendar-date">{cell.dayNumber}</div>
                      <div className="finance-calendar-amount income">
                        +{money(cell.income)}
                      </div>
                      <div className="finance-calendar-amount expense">
                        -{money(cell.expense)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

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
                          max="9999999999999.99"
                          step="0.01"
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

          {/* STATS CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Total Saved Card */}
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.05)" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderLeft: "4px solid var(--accent-green)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--accent-green-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-green)",
                }}
              >
                <PiggyBank size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                  Total Saved
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
                  ¥{(data?.user?.total_saved || 0).toLocaleString()}
                </div>
              </div>
            </motion.div>

            {/* Savings Streak Card */}
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.05)" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderLeft: "4px solid var(--accent-yellow)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--accent-yellow-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-yellow)",
                }}
              >
                <Flame size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                  Savings Streak
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
                  {data?.user?.streak_days || 0} Days
                </div>
              </div>
            </motion.div>

            {/* Completed Goals Card */}
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.05)" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderLeft: "4px solid var(--accent-blue)",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--accent-blue-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-blue)",
                }}
              >
                <Trophy size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                  Completed Goals
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
                  {data?.user?.total_targets_completed || 0}
                </div>
              </div>
            </motion.div>

            {/* Saver Rank Card */}
            <motion.div
              className="card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0, 0, 0, 0.05)" }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: 16,
                borderLeft: "4px solid #A28DFF",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#E8E5FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7C3AED",
                }}
              >
                <Award size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700 }}>
                  Saver Rank
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>
                  {data?.user?.rank || "Bronze"}
                </div>
              </div>
            </motion.div>
          </div>

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
          <motion.div
            className="card daily-quests-card"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title"><Gift size={19} /> Daily Money Quests</h3>
                <p className="daily-quest-subtitle">Small money habits grow your pet bond.</p>
              </div>
              <span className="daily-quest-total">
                {dailyQuests.filter((quest) => quest.claimed).length}/{dailyQuests.length}
              </span>
            </div>

            <div className="daily-quest-list">
              {dailyQuests.map((quest) => (
                <div className={`daily-quest-item ${quest.claimed ? "claimed" : ""}`} key={quest.id}>
                  <span className="daily-quest-icon">{quest.icon}</span>
                  <div className="daily-quest-copy">
                    <strong>{quest.title}</strong>
                    <span>{quest.description}</span>
                    <div className="daily-quest-progress">
                      <div style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="daily-quest-claim"
                    disabled={!quest.completed || quest.claimed}
                    onClick={() => handleClaimDailyQuest(quest.id)}
                  >
                    {quest.claimed
                      ? <CheckCircle2 size={17} />
                      : quest.completed
                        ? `+${quest.reward}`
                        : quest.id === "save_today"
                          ? `¥${Number(quest.progress).toLocaleString()}/¥${Number(quest.target).toLocaleString()}`
                          : `${quest.progress}/${quest.target}`}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

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
              {shopPreview.map((item) => (
                <div key={item.id} className="shop-item">
                  <span className="shop-item-icon">{getShopPreviewIcon(item)}</span>
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
