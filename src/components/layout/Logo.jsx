import React, { useId } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export const LogoMark = ({ className = "h-7 w-7" }) => {
  // Unique per instance: a duplicate id inside a hidden sidebar breaks the fill.
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <rect x="7" y="8" width="5" height="16" rx="1.5" fill="#fff" />
      <rect x="13.5" y="8" width="5" height="11" rx="1.5" fill="#fff" fillOpacity=".8" />
      <rect x="20" y="8" width="5" height="7" rx="1.5" fill="#fff" fillOpacity=".6" />
    </svg>
  );
};

const Logo = ({ to = "/board", className = "" }) => (
  <Link to={to} className={cn("flex items-center gap-2", className)}>
    <LogoMark />
    <span className="text-[15px] font-semibold tracking-tight text-surface-900 dark:text-surface-50">
      Kanban<span className="text-primary-600 dark:text-primary-400">Pro</span>
    </span>
  </Link>
);

export default Logo;
