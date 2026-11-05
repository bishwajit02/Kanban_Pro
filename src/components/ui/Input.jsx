import React, { forwardRef, useId } from "react";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "../../lib/utils";

const Field = ({ id, label, hint, error, className, children }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="field-label">
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className="mt-1.5 text-xs text-error-600 dark:text-error-400">{error}</p>
    ) : (
      hint && <p className="mt-1.5 text-xs text-surface-500">{hint}</p>
    )}
  </div>
);

const Input = forwardRef(
  (
    { label, hint, error, leftIcon: LeftIcon, rightElement, className = "", containerClassName = "", id, ...props },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    return (
      <Field id={inputId} label={label} hint={hint} error={error} className={containerClassName}>
        <div className="relative">
          {LeftIcon && (
            <LeftIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              "field",
              LeftIcon && "pl-9",
              rightElement && "pr-10",
              error && "border-error-500 focus:border-error-500 focus:ring-error-500/15",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{rightElement}</div>
          )}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef(({ label, hint, error, className = "", containerClassName = "", id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field id={inputId} label={label} hint={hint} error={error} className={containerClassName}>
      <textarea ref={ref} id={inputId} className={cn("field min-h-24 resize-y leading-relaxed", className)} {...props} />
    </Field>
  );
});
Textarea.displayName = "Textarea";

export const Select = forwardRef(({ label, hint, error, className = "", containerClassName = "", id, children, ...props }, ref) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field id={inputId} label={label} hint={hint} error={error} className={containerClassName}>
      <div className="relative">
        <select ref={ref} id={inputId} className={cn("field appearance-none pr-8", className)} {...props}>
          {children}
        </select>
        <FiChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-surface-400" />
      </div>
    </Field>
  );
});
Select.displayName = "Select";

export default Input;
