import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, TrendingUp, TrendingDown, PiggyBank, Calendar } from "lucide-react";

/**
 * WeeklySummaryNotice - Shows a weekly recap of savings and expenses.
 * Props:
 *   summary: {
 *     totalSaved: number,
 *     totalSpent: number,
 *     savingsRate: number,  // 0-100 percent
 *     petName: string,
 *     petEmoji: string,
 *     savingsChange: number,  // positive/negative vs last week
 *   } | null
 *   onClose: () => void
 */
export default function WeeklySummaryNotice({ summary, onClose }) {
  if (!summary) return null;

  const { totalSaved, totalSpent, savingsRate, petName, petEmoji, savingsChange } = summary;
  const savingsRateClamped = Math.max(0, Math.min(100, savingsRate));
  const isGoodRate = savingsRateClamped >= 30;

  const motivationalMessages = {
    great: [
      `${petEmoji} ${petName} is super proud of you! Amazing week! 🌟`,
      `${petEmoji} You're on fire! ${petName} did a happy dance! 🔥`,
    ],
    good: [
      `${petEmoji} ${petName} is cheering you on! Keep going! 💪`,
      `${petEmoji} Great effort this week! ${petName} loves you! ❤️`,
    ],
    low: [
      `${petEmoji} ${petName} is a little hungry... Let's save more next week! 🍲`,
      `${petEmoji} Don't worry! ${petName} believes you can do better! 🌱`,
    ],
  };

  const getMotivation = () => {
    const category = savingsRateClamped >= 50 ? "great" : savingsRateClamped >= 20 ? "good" : "low";
    const msgs = motivationalMessages[category];
    return msgs[Math.floor(Date.now() / 1000) % msgs.length];
  };

  const fmt = (n) =>
    Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          className="goal-completion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 10001 }}
        >
          <motion.div
            className="goal-completion-notice weekly-summary-notice"
            initial={{ opacity: 0, y: 30, scale: 0.90 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-summary-title"
          >
            <button
              type="button"
              className="goal-completion-close"
              onClick={onClose}
              aria-label="Close weekly summary"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Calendar size={22} style={{ color: "var(--accent-green)" }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1.5, color: "var(--accent-green)", textTransform: "uppercase" }}>
                  Weekly Report
                </div>
                <h3 id="weekly-summary-title" style={{ margin: 0, fontSize: 18, color: "var(--text-primary)" }}>
                  Your Week in Review 📊
                </h3>
              </div>
            </div>

            {/* Stats row */}
            <div className="weekly-stats-row">
              <div className="weekly-stat-card weekly-stat-saved">
                <TrendingUp size={18} />
                <div>
                  <div className="weekly-stat-label">Total Saved</div>
                  <div className="weekly-stat-value">¥{fmt(totalSaved)}</div>
                </div>
              </div>
              <div className="weekly-stat-card weekly-stat-spent">
                <TrendingDown size={18} />
                <div>
                  <div className="weekly-stat-label">Total Spent</div>
                  <div className="weekly-stat-value">¥{fmt(totalSpent)}</div>
                </div>
              </div>
            </div>

            {/* Savings rate bar */}
            <div className="weekly-rate-section">
              <div className="weekly-rate-header">
                <span>Savings Rate</span>
                <span style={{ fontWeight: 700, color: isGoodRate ? "var(--accent-green)" : "var(--warning)" }}>
                  {savingsRateClamped.toFixed(0)}%
                </span>
              </div>
              <div className="weekly-rate-track">
                <motion.div
                  className="weekly-rate-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${savingsRateClamped}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    background: isGoodRate
                      ? "linear-gradient(90deg, var(--accent-green), #22c55e)"
                      : "linear-gradient(90deg, #f97316, #ef4444)",
                  }}
                />
              </div>
            </div>

            {/* Pet message */}
            <div className="weekly-pet-message">
              <p>{getMotivation()}</p>
            </div>

            <button type="button" className="goal-completion-action" onClick={onClose}>
              Let's Crush Next Week! 💪
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
