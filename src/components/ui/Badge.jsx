import React from "react";

const Badge = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  dot = false,
  icon: Icon,
}) => {
  const variants = {
    primary: "badge-primary",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    surface: "bg-surface-100 text-surface-600 border-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`badge ${variants[variant]} ${sizes[size]} ${className} transition-all duration-200`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            variant === "primary"
              ? "bg-primary-500"
              : variant === "success"
              ? "bg-success-500"
              : variant === "warning"
              ? "bg-warning-500"
              : variant === "error"
              ? "bg-error-500"
              : "bg-surface-400"
          }`}
        />
      )}
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {children}
    </span>
  );
};

export default Badge;
