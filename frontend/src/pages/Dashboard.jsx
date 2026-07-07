import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
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
  AlertTriangle,
  X,
  Trash2,
  Trophy,
  Award,
  PiggyBank,
  MessageCircle,
  Gift,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  User,
} from "lucide-react";
import {
  dashboard as dashboardApi,
  dailyQuests as dailyQuestApi,
  transactions as txApi,
  avatars as avatarApi,
  user as userApi,
  targets as targetApi,
  calendar as calendarApi,
  shop as shopApi,
} from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import FinanceCalendar from "../components/FinanceCalendar.jsx";
import { useLanguage } from "../i18n.jsx";
import { realOCR } from "./ReceiptScanner.jsx";
import { avatarEmojis, avatarTypes, getPetImageForTarget } from "../petAssets.js";
import shibaSadAnimation from "../assets/lottie/shiba-sad.json";
import shoppingAnimation from "../assets/lottie/shopping.json";

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

const careActions = [
  { id: "play", icon: "🎾", title: "Play", effect: "+10 Happiness" },
  { id: "feed", icon: "🍖", title: "Feed", effect: "+10 Fullness" },
  { id: "rest", icon: "🛏️", title: "Rest", effect: "+10 Energy" },
  { id: "shower", icon: "🚿", title: "Shower", effect: "+5 Happiness" },
];

const tutorialContent = {
  ja: {
    button: "使い方",
    title: "Pet Saver の使い方",
    subtitle: "5つのステップで、ペットと一緒に貯金を始めましょう。",
    back: "戻る",
    next: "次へ",
    done: "完了",
    open: "この機能を開く",
    step: "ステップ",
    steps: [
      { icon: "🎯", title: "貯金目標を作る", body: "「目標」ページで目標金額、期限、育てたいペットを設定します。最初にここを設定すると、ホームにペットが表示されます。", path: "/goals", action: "目標を開く" },
      { icon: "💰", title: "毎日貯金する", body: "ホームの＋ボタンから貯金額を入力します。貯金すると目標の進捗、ペットのEXP、幸福度が上がります。", path: "/", action: "ホームで貯金する" },
      { icon: "📸", title: "レシートを記録する", body: "「レシートスキャナー」で写真を読み取ると、店名、金額、日付を自動入力して支出履歴に保存できます。", path: "/scanner", action: "スキャナーを開く" },
      { icon: "📊", title: "支出を分析する", body: "「支出分析」ではカテゴリ別の支出を確認できます。「AIアドバイス」では実際の履歴から節約方法を提案します。", path: "/expense-analyst", action: "支出分析を開く" },
      { icon: "🐾", title: "ペットと習慣を続ける", body: "デイリーミッション、ペットのお世話、マネープランナーを使って毎日の習慣を続けましょう。達成するとコインやEXPを獲得できます。", path: "/planner", action: "プランナーを開く" },
    ],
  },
  my: {
    button: "သုံးနည်း",
    title: "Pet Saver သုံးနည်း",
    subtitle: "Pet နဲ့အတူ ငွေစတင်စုဖို့ အဆင့် ၅ ဆင့်ကိုလိုက်လုပ်ပါ။",
    back: "နောက်သို့",
    next: "ရှေ့သို့",
    done: "ပြီးပါပြီ",
    open: "ဒီ Function ကိုဖွင့်မယ်",
    step: "အဆင့်",
    steps: [
      { icon: "🎯", title: "Saving Goal ဖန်တီးပါ", body: "Goals page မှာ စုချင်တဲ့ပမာဏ၊ deadline နဲ့ မွေးချင်တဲ့ pet ကိုရွေးပါ။ Goal ရှိမှ Home မှာ pet ပေါ်လာမယ်။", path: "/goals", action: "Goals ကိုဖွင့်မယ်" },
      { icon: "💰", title: "နေ့စဉ် ငွေစုပါ", body: "Home က + button ကိုနှိပ်ပြီး saving amount ထည့်ပါ။ ငွေစုတိုင်း Goal progress၊ Pet EXP နဲ့ Happiness တက်မယ်။", path: "/", action: "Home မှာစုမယ်" },
      { icon: "📸", title: "Receipt ကိုမှတ်တမ်းတင်ပါ", body: "Receipt Scanner မှာ ဘောင်ချာဓာတ်ပုံတင်ရင် ဆိုင်နာမည်၊ ပမာဏနဲ့ ရက်စွဲကိုဖတ်ပြီး expense history ထဲသိမ်းပေးမယ်။", path: "/scanner", action: "Scanner ကိုဖွင့်မယ်" },
      { icon: "📊", title: "အသုံးစရိတ်ကို Analysis လုပ်ပါ", body: "Expense pages မှာ category အလိုက်အသုံးစရိတ်ကြည့်နိုင်ပြီး Expense Analyst က history အပေါ်မူတည်ပြီး saving advice ပေးမယ်။", path: "/expense-analyst", action: "Analyst ကိုဖွင့်မယ်" },
      { icon: "🐾", title: "Pet နဲ့ habit ဆက်လုပ်ပါ", body: "Daily Quests၊ Pet Care နဲ့ Planner ကိုသုံးပြီး habit တည်ဆောက်ပါ။ ပြီးမြောက်ရင် Coins နဲ့ Pet EXP ရမယ်။", path: "/planner", action: "Planner ကိုဖွင့်မယ်" },
    ],
  },
  en: {
    button: "App Guide",
    title: "How to use Pet Saver",
    subtitle: "Follow five simple steps to save money with your pet.",
    back: "Back",
    next: "Next",
    done: "Done",
    open: "Open this feature",
    step: "Step",
    steps: [
      { icon: "🎯", title: "Create a savings goal", body: "Open Goals and choose an amount, deadline, and pet. Your pet appears on Home after you create a goal.", path: "/goals", action: "Open Goals" },
      { icon: "💰", title: "Save money every day", body: "Use the + button on Home to record savings. Every deposit grows your goal progress, pet EXP, and happiness.", path: "/", action: "Save on Home" },
      { icon: "📸", title: "Record receipts", body: "Upload a receipt in Receipt Scanner to detect the store, total, and date, then save it to expense history.", path: "/scanner", action: "Open Scanner" },
      { icon: "📊", title: "Understand your spending", body: "Review spending by category and open Expense Analyst for advice based on your real expense history.", path: "/expense-analyst", action: "Open Analyst" },
      { icon: "🐾", title: "Build the habit with your pet", body: "Complete Daily Quests, care for your pet, and use Planner. Consistent actions earn coins and pet EXP.", path: "/planner", action: "Open Planner" },
    ],
  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [petReaction, setPetReaction] = useState(null);
  const [conversationIndex, setConversationIndex] = useState(0);
  const [caringAction, setCaringAction] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [animatingPet, setAnimatingPet] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveAmount, setSaveAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => formatDateKey(new Date()));
  const [transactionType, setTransactionType] = useState("deposit");
  const [transactionCategory, setTransactionCategory] = useState("General");
  const [transactionNote, setTransactionNote] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [deletingExpiredGoal, setDeletingExpiredGoal] = useState(false);
  const [shopConfirmItem, setShopConfirmItem] = useState(null);
  const [buyingShopItemId, setBuyingShopItemId] = useState(null);
  const [shopNotice, setShopNotice] = useState(null);
  const fileInputRef = useRef(null);
  const { user, updateUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const tutorial = tutorialContent[language] || tutorialContent.en;
  const activeTutorialStep = tutorial.steps[tutorialStep];

  const openTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const openTutorialFeature = () => {
    setShowTutorial(false);
    navigate(activeTutorialStep.path);
  };

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
  const shopPreview = (data?.shopPreview || []).filter(item => item.category === "avatar" && item.avatar_type);
  const achievementsPreview = (data?.achievements || []).filter((ach) => ach.is_unlocked).slice(0, 4);
  const getShopPreviewIcon = (item) => {
    if (item.avatar_type) return avatarTypes.find(type => type.id === item.avatar_type)?.emoji || item.icon;
    return item.icon;
  };
  const quickSaveDate = new Date(`${transactionDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
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
    border: "1px solid var(--border-color)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    boxShadow: "0 28px 70px rgba(0, 0, 0, 0.15)",
  };


  const getPetImage = () => {
    return getPetImageForTarget(target);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!shopNotice) return undefined;
    const timer = setTimeout(() => setShopNotice(null), 3600);
    return () => clearTimeout(timer);
  }, [shopNotice]);

  const loadDashboard = async () => {
    try {
      const dashboardRes = await dashboardApi.get();

      setData(dashboardRes.data);
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

  const handleShopPreviewClick = (item) => {
    if (item.owned) {
      showToast("You already own this item.");
      return;
    }

    if (Number(user?.coins || data?.user?.coins || 0) < Number(item.price || 0)) {
      setShopNotice({
        type: "error",
        title: "Not enough coins",
        message: `You need ${Number(item.price || 0).toLocaleString()} coins to unlock ${item.name}.`,
      });
      return;
    }

    setShopConfirmItem(item);
  };

  const confirmShopPurchase = async () => {
    if (!shopConfirmItem || buyingShopItemId) return;

    const item = shopConfirmItem;
    setBuyingShopItemId(item.id);
    try {
      await shopApi.buy(item.id);
      const nextCoins = Math.max(0, Number(user?.coins || data?.user?.coins || 0) - Number(item.price || 0));

      updateUser({ coins: nextCoins });
      setData((prev) => ({
        ...prev,
        user: { ...prev.user, coins: nextCoins },
        shopPreview: (prev.shopPreview || []).map((previewItem) => (
          previewItem.id === item.id ? { ...previewItem, owned: true } : previewItem
        )),
      }));
      setShopConfirmItem(null);
      setShopNotice({
        type: "success",
        title: "Congratulations!",
        message: `You've unlocked a new avatar: ${item.name}.`,
      });
      loadDashboard();
    } catch (err) {
      setShopNotice({
        type: "error",
        title: err.message === "Not enough coins" ? "Not enough coins" : "Purchase failed",
        message: err.message || "Please try again.",
      });
    } finally {
      setBuyingShopItemId(null);
    }
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
        date: transactionDate,
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
    setSaveAmount(String(petSavingAmount));
    setTransactionDate(formatDateKey(new Date()));
    setTransactionType("deposit");
    setTransactionCategory("Pet Saving");
    setTransactionNote(`Daily mission for ${data.activeTarget.avatar_name || data.activeTarget.name}`);
    setShowSaveModal(true);
  };

  const handleCare = async (action) => {
    if (!data?.activeTarget || caringAction) return;
    if (careActionsRemaining <= 0) {
      showToast("Daily care limit reached. Come back tomorrow.", "error");
      return;
    }
    setCaringAction(action.id);
    try {
      const res = await avatarApi.care({
        target_id: data.activeTarget.id,
        action: action.id,
      });
      showPetReaction({
        emoji: action.icon,
        message: `${data.activeTarget.avatar_name} enjoyed ${action.title.toLowerCase()} time!`,
        exp_gain: Number(res.data?.exp_gain || 0),
        happiness_gain: action.id === "play" ? 10 : action.id === "shower" ? 5 : 0,
      });
      const nextRemaining = Number(res.data?.care_actions_remaining ?? 0);
      if (nextRemaining <= 0) {
        showToast(`${action.title} complete. Daily care limit reached.`);
      } else {
        showToast(`${action.title} complete. ${nextRemaining}/3 care rewards left today.`);
      }
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
    } finally {
      setCaringAction(null);
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
    setTransactionDate(formatDateKey(new Date()));
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
        {shopNotice && (
          <motion.div
            className="shop-notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShopNotice(null)}
          >
            <motion.div
              className={`shop-notification ${shopNotice.type}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
            >
              <Lottie
                animationData={shopNotice.type === "success" ? shoppingAnimation : shibaSadAnimation}
                loop={shopNotice.type !== "success"}
                className="shop-notification-animation"
              />
              <div className="shop-notification-copy">
                <h3>{shopNotice.title}</h3>
                <p>{shopNotice.message}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shopConfirmItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShopConfirmItem(null)}
          >
            <motion.div
              className="delete-confirm-modal"
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="delete-confirm-box">
                <button className="modal-close delete-confirm-close" onClick={() => setShopConfirmItem(null)} aria-label="Close">
                  <X size={18} />
                </button>
                <div style={{ fontSize: 46, marginBottom: 8 }}>{getShopPreviewIcon(shopConfirmItem)}</div>
                <h3>Buy this item?</h3>
                <p>
                  {shopConfirmItem.name} costs {Number(shopConfirmItem.price || 0).toLocaleString()} coins.
                </p>
                <div className="delete-confirm-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShopConfirmItem(null)}
                    disabled={buyingShopItemId === shopConfirmItem.id}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={confirmShopPurchase}
                    disabled={buyingShopItemId === shopConfirmItem.id}
                  >
                    {buyingShopItemId === shopConfirmItem.id ? "Buying..." : "Yes"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <motion.div
            className="tutorial-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTutorial(false)}
          >
            <motion.div
              className="tutorial-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tutorial-title"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="tutorial-header">
                <div className="tutorial-heading-icon"><BookOpen size={23} /></div>
                <div>
                  <h3 id="tutorial-title">{tutorial.title}</h3>
                  <p>{tutorial.subtitle}</p>
                </div>
                <button type="button" className="tutorial-close" onClick={() => setShowTutorial(false)} aria-label="Close tutorial">
                  <X size={20} />
                </button>
              </div>

              <div className="tutorial-progress" aria-label={`${tutorial.step} ${tutorialStep + 1}`}>
                {tutorial.steps.map((_, index) => (
                  <span key={index} className={index <= tutorialStep ? "active" : ""} />
                ))}
              </div>

              <motion.div
                className="tutorial-step-card"
                key={`${language}-${tutorialStep}`}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="tutorial-step-number">{tutorial.step} {tutorialStep + 1} / {tutorial.steps.length}</div>
                <div className="tutorial-step-icon">{activeTutorialStep.icon}</div>
                <h4>{activeTutorialStep.title}</h4>
                <p>{activeTutorialStep.body}</p>
                <button type="button" className="tutorial-open-feature" onClick={openTutorialFeature}>
                  {activeTutorialStep.action || tutorial.open} <ArrowRight size={16} />
                </button>
              </motion.div>

              <div className="tutorial-actions">
                <button
                  type="button"
                  className="tutorial-back"
                  onClick={() => setTutorialStep((step) => Math.max(0, step - 1))}
                  disabled={tutorialStep === 0}
                >
                  <ChevronLeft size={17} /> {tutorial.back}
                </button>
                <button
                  type="button"
                  className="tutorial-next"
                  onClick={() => {
                    if (tutorialStep === tutorial.steps.length - 1) setShowTutorial(false);
                    else setTutorialStep((step) => step + 1);
                  }}
                >
                  {tutorialStep === tutorial.steps.length - 1 ? tutorial.done : tutorial.next}
                  {tutorialStep < tutorial.steps.length - 1 && <ArrowRight size={17} />}
                </button>
              </div>
            </motion.div>
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
        <div className="page-title home-title-with-profile">
          <div className="home-profile-avatar">
            {user?.profile_image || data?.user?.profile_image ? (
              <img src={user?.profile_image || data?.user?.profile_image} alt="Profile" />
            ) : (
              <User size={24} />
            )}
          </div>
          <div>
            <h2>Hello, {user?.username || data?.user?.username || "Saver"}! 👋</h2>
            <p>Save toward your target and watch your pet react.</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="streak-badge">
            <Flame size={20} />
            <span>{data?.user?.streak_days || 0} Day Streak</span>
          </div>
          <button type="button" className="tutorial-trigger" onClick={openTutorial}>
            <BookOpen size={18} />
            <span>{tutorial.button}</span>
          </button>
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
                <div className={`pet-mood ${petMood}`}>
                  <span>{moodEmojis[petMood] || "😐"}</span>
                  <span>
                    {petMood.charAt(0).toUpperCase() + petMood.slice(1)}
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
                  <span className="care-count">{careActionsRemaining}/3 EXP rewards left</span>
                </div>

                <div className="care-grid">
                  {careActions.map((action) => (
                    <button
                      type="button"
                      className="care-btn"
                      key={action.id}
                      onClick={() => handleCare(action)}
                      disabled={caringAction !== null}
                    >
                      <span className="care-btn-icon">{action.icon}</span>
                      <span className="care-btn-title">
                        {caringAction === action.id ? "Treating..." : action.title}
                      </span>
                      <span className="care-btn-effect">
                        {careActionsRemaining > 0 ? action.effect : "Care only · EXP maxed"}
                      </span>
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
                    ? "linear-gradient(135deg, var(--accent-green-light) 0%, var(--bg-card) 100%)"
                    : "linear-gradient(135deg, var(--accent-orange-light) 0%, var(--bg-card) 100%)",
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

          <div style={{ marginTop: 24 }}>
            <FinanceCalendar onChanged={loadDashboard} />
          </div>

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
                        background: "var(--bg-primary)",
                        border: "none",
                        color: "var(--text-secondary)",
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
                        background: "var(--bg-primary)",
                        border: "none",
                        color: "var(--text-secondary)",
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
                            ? "1px solid var(--accent-green)"
                            : "1px solid var(--border-color)",
                        background:
                          transactionType === "deposit" ? "var(--accent-green-light)" : "var(--bg-card)",
                        color:
                          transactionType === "deposit" ? "var(--accent-green-dark)" : "var(--text-secondary)",
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
                            : "1px solid var(--border-color)",
                        background:
                          transactionType === "withdrawal"
                            ? "rgba(244, 63, 94, 0.16)"
                            : "var(--bg-card)",
                        color:
                          transactionType === "withdrawal"
                            ? "#f43f5e"
                            : "var(--text-secondary)",
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
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-secondary)",
                        color: "var(--text-muted)",
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
                      borderBottom: "1px solid var(--border-color)",
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
                          color: "var(--text-primary)",
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
                            color: "var(--text-primary)",
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
                          background: "var(--bg-secondary)",
                        }}
                        value={transactionCategory}
                        onChange={(e) => setTransactionCategory(e.target.value)}
                      >
                        <option value="General">General</option>
                        <option value="Pet Saving">Pet Saving</option>
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
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
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
                  background: "var(--accent-purple-light, rgba(167, 139, 250, 0.16))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-purple)",
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

          {/* ACHIEVEMENTS moved to the right sidebar */}
          {false && (
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
          )}
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
                <div
                  key={item.id}
                  className={`shop-item ${item.owned ? "owned" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleShopPreviewClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") handleShopPreviewClick(item);
                  }}
                >
                  {item.owned && <div className="shop-item-owned-badge">Owned</div>}
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

          {/* ACHIEVEMENTS */}
          <motion.div
            className="card dashboard-achievements-card"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.58 }}
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
            <div className="side-achievement-grid">
              {achievementsPreview.map((ach) => (
                <button
                  type="button"
                  key={ach.id}
                  className={`side-achievement-card ${ach.is_unlocked ? "unlocked" : ""}`}
                  onClick={() => navigate("/achievements")}
                >
                  <span className={`side-achievement-icon ${ach.tier}`}>
                    {ach.is_unlocked ? "✓" : "🔒"}
                  </span>
                  <span className="side-achievement-copy">
                    <strong>{ach.title}</strong>
                    <small>{ach.description}</small>
                  </span>
                </button>
              ))}
              {achievementsPreview.length === 0 && (
                <div className="side-achievement-empty">
                  No unlocked achievements yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
