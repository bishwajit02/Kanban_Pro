import React from "react";
import { cn } from "../../lib/utils";
import Spinner from "./Spinner";

const variants = {
  primary:
    "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-500 dark:hover:bg-primary-400 dark:text-white",
  secondary:
    "bg-white text-surface-800 border border-surface-200 shadow-xs hover:bg-surface-50 hover:border-surface-300 dark:bg-surface-900 dark:text-surface-100 dark:border-surface-800 dark:hover:bg-surface-800",
  ghost:
    "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100",
  danger:
    "bg-error-600 text-white shadow-sm hover:bg-error-700 dark:bg-error-500 dark:hover:bg-error-600",
  "danger-ghost":
    "text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-9 px-3.5 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-lg",
};

const iconSizes = { sm: "h-8 w-8 rounded-md", md: "h-9 w-9 rounded-lg", lg: "h-11 w-11 rounded-lg" };

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  disabled = false,
  iconOnly = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = "button",
  ...props
}) => {
  const iconClass = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        iconOnly ? iconSizes[size] : sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? <Spinner className={iconClass} /> : LeftIcon && <LeftIcon className={iconClass} />}
      {children}
      {!isLoading && RightIcon && <RightIcon className={iconClass} />}
    </button>
  );
};

export default Button;
