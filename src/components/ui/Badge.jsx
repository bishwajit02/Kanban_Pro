import React from "react";
import { cn } from "../../lib/utils";

const variants = {
  neutral: "bg-surface-100 text-surface-600 ring-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:ring-surface-700",
  primary: "bg-primary-50 text-primary-700 ring-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/25",
  success: "bg-success-50 text-success-700 ring-success-100 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/25",
  warning: "bg-warning-50 text-warning-700 ring-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/25",
  error: "bg-error-50 text-error-700 ring-error-100 dark:bg-error-500/10 dark:text-error-400 dark:ring-error-500/25",
};

const dots = {
  neutral: "bg-surface-400",
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
};

const Badge = ({ children, variant = "neutral", dot = false, icon: Icon, className = "" }) => (
  <span
    className={cn(
      "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset",
      variants[variant],
      className
    )}
  >
    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[variant])} />}
    {Icon && <Icon className="h-3 w-3" />}
    {children}
  </span>
);

export default Badge;
