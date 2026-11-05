import React from "react";
import { cn } from "../../lib/utils";

const Card = ({ children, className = "", as: Tag = "div", ...props }) => (
  <Tag
    className={cn(
      "rounded-xl border border-surface-200 bg-white shadow-card dark:border-surface-800 dark:bg-surface-900",
      className
    )}
    {...props}
  >
    {children}
  </Tag>
);

const CardHeader = ({ title, description, actions, className = "" }) => (
  <div
    className={cn(
      "flex flex-wrap items-start justify-between gap-3 border-b border-surface-100 px-5 py-4 dark:border-surface-800",
      className
    )}
  >
    <div className="min-w-0">
      <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{description}</p>}
    </div>
    {actions}
  </div>
);

const CardBody = ({ children, className = "" }) => <div className={cn("p-5", className)}>{children}</div>;

const CardFooter = ({ children, className = "" }) => (
  <div
    className={cn(
      "flex items-center justify-end gap-2 rounded-b-xl border-t border-surface-100 bg-surface-50/60 px-5 py-3 dark:border-surface-800 dark:bg-surface-900/60",
      className
    )}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
