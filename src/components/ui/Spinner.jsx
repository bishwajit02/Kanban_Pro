import React from "react";
import { cn } from "../../lib/utils";

const Spinner = ({ className = "h-4 w-4" }) => (
  <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const PageLoader = ({ label = "Loading" }) => (
  <div className="flex flex-1 items-center justify-center py-24">
    <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
      <Spinner className="h-5 w-5 text-primary-500" />
      {label}
    </div>
  </div>
);

export default Spinner;
