import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trophy, Star, Zap, Award } from "lucide-react";

/**
 * AchievementUnlockNotice - Celebrates when a user earns an achievement badge.
 * Props:
 *   achievement: { id, title, description, icon, coins } | null
 *   onClose: () => void
 */
export default function AchievementUnlockNotice({ achievement, onClose }) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="goal-completion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 10000 }}
        >
          <motion.div
            className="goal-completion-notice achievement-notice"
            initial={{ opacity: 0, y: 32, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievement-title"
          >
            <button
              type="button"
              className="goal-completion-close"
              onClick={onClose}
              aria-label="Close achievement notification"
            >
              <X size={18} />
            </button>

            {/* Decorative stars */}
            <div className="achievement-stars">
              <motion.span
                animate={{ rotate: [0, 20, -15, 0], scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, delay: 0 }}
              >⭐</motion.span>
              <motion.span
                animate={{ rotate: [0, -18, 14, 0], scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.4 }}
              >✨</motion.span>
              <motion.span
                animate={{ rotate: [0, 22, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2.0, delay: 0.8 }}
              >⭐</motion.span>
            </div>

            {/* Badge icon */}
            <motion.div
              className="achievement-badge-icon"
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
            >
              <span style={{ fontSize: 56 }}>{achievement.icon || "🏆"}</span>
            </motion.div>

            <div className="goal-completion-copy">
              <span style={{ color: "var(--accent-green)", fontWeight: 700, letterSpacing: 1 }}>
                🎖️ ACHIEVEMENT UNLOCKED
              </span>
              <h3
                id="achievement-title"
                style={{ fontSize: 22, margin: "8px 0 4px", color: "var(--text-primary)" }}
              >
                {achievement.title}
              </h3>
              <p style={{ margin: "0 0 12px", color: "var(--text-secondary)" }}>
                {achievement.description}
              </p>
              {achievement.coins > 0 && (
                <div className="achievement-coins-reward">
                  <span>🪙</span>
                  <span>+{achievement.coins} Coins Rewarded!</span>
                </div>
              )}
            </div>

            <button type="button" className="goal-completion-action" onClick={onClose}>
              Awesome! 🎉
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
