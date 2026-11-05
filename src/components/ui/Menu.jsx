import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Minimal dropdown menu. `trigger` receives ({ open, toggle }) and returns the
 * button. Clicking any MenuItem closes the menu.
 */
const Menu = ({ trigger, children, align = "right", side = "bottom", className = "" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-40 min-w-48 rounded-xl border border-surface-200 bg-white p-1 shadow-pop dark:border-surface-800 dark:bg-surface-900",
              align === "right" ? "right-0" : "left-0",
              side === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-1.5 origin-top",
              className
            )}
            onClick={(e) => e.target.closest('[role="menuitem"]') && setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const MenuItem = ({ icon: Icon, children, danger = false, className = "", ...props }) => (
  <button
    type="button"
    role="menuitem"
    className={cn(
      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
      danger
        ? "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
        : "text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800",
      className
    )}
    {...props}
  >
    {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
    {children}
  </button>
);

export const MenuSeparator = () => <div className="my-1 h-px bg-surface-100 dark:bg-surface-800" />;

export default Menu;
