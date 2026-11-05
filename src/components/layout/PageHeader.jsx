import React from "react";
import { cn } from "../../lib/utils";

const PageHeader = ({ title, description, actions, children, className = "" }) => (
  <header
    className={cn(
      "border-b border-surface-200 bg-white px-4 py-5 sm:px-6 lg:px-8 dark:border-surface-800 dark:bg-surface-950",
      className
    )}
  >
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-60 flex-1">
        {typeof title === "string" ? (
          <h1 className="text-xl font-semibold tracking-tight text-surface-900 dark:text-surface-50">{title}</h1>
        ) : (
          title
        )}
        {typeof description === "string" ? (
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
        ) : (
          description
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </header>
);

export default PageHeader;
