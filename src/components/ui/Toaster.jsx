import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { dismissToast, useToasts } from "../../lib/toast";

const icons = {
  default: <FiInfo className="h-4 w-4 text-surface-400" />,
  success: <FiCheckCircle className="h-4 w-4 text-success-500" />,
  error: <FiAlertCircle className="h-4 w-4 text-error-500" />,
};

const Toaster = () => {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 left-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-surface-200 bg-white py-2.5 pr-2 pl-3.5 text-sm shadow-pop dark:border-surface-800 dark:bg-surface-900"
          >
            {icons[t.tone]}
            <p className="flex-1 text-surface-700 dark:text-surface-200">{t.message}</p>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action.onClick();
                  dismissToast(t.id);
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(t.id)}
              className="rounded-md p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;
