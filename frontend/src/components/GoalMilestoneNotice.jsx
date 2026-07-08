import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lottie from "lottie-react";
import { X } from "lucide-react";
import catPlayingAnimation from "../assets/lottie/cat-playing.json";

export default function GoalMilestoneNotice({ notice, onClose }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          className="goal-completion-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 9999 }}
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
            aria-labelledby="goal-milestone-title"
          >
            <button
              type="button"
              className="goal-completion-close"
              onClick={onClose}
              aria-label="Close milestone notification"
            >
              <X size={18} />
            </button>
            <Lottie animationData={catPlayingAnimation} loop={true} className="goal-completion-animation" style={{ height: 160 }} />
            <div className="goal-completion-copy">
              <span>Goal Progress Milestone</span>
              <h3 id="goal-milestone-title" style={{ color: 'var(--accent-green)', fontSize: 24, margin: '8px 0' }}>
                {notice.milestone}% Reached! 🎉
              </h3>
              <p>
                Awesome job saving for <strong>{notice.goalName}</strong>! Your pet <strong>{notice.avatarName}</strong> is super happy and cheering for you!
              </p>
            </div>
            <button type="button" className="goal-completion-action" onClick={onClose}>
              Keep Saving / ဆက်လက်စုဆောင်းမယ်
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
