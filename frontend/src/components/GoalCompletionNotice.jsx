import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import trophyAnimation from "../assets/lottie/trophy.json";

export default function GoalCompletionNotice({ notice, onClose }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          className="goal-completion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="goal-completion-notice"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.24 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-completion-title"
          >
            <button
              type="button"
              className="goal-completion-close"
              onClick={onClose}
              aria-label="Close goal completion notification"
            >
              <X size={18} />
            </button>
            <Lottie animationData={trophyAnimation} loop={false} className="goal-completion-animation" />
            <div className="goal-completion-copy">
              <span>Goal completed</span>
              <h3 id="goal-completion-title">Congratulations!</h3>
              <p>
                You've achieved your goal{notice.goalName ? `: ${notice.goalName}` : ""}. I hope you can keep it
                this way.
              </p>
              {Number(notice.coinsEarned || 0) > 0 && (
                <small>+{Number(notice.coinsEarned || 0).toLocaleString()} coins earned</small>
              )}
            </div>
            <button type="button" className="goal-completion-action" onClick={onClose}>
              Keep going
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
