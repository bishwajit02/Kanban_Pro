import React from "react";

const Input = ({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = "",
  containerClassName = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">
          {label}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
            <LeftIcon className="w-5 h-5 text-surface-400" />
          </div>
        )}
        <input
          className={`input ${LeftIcon ? "pl-11" : ""} ${
            RightIcon ? "pr-11" : ""
          } ${error ? "border-error-500 focus:ring-error-500/10" : ""} ${className}`}
          {...props}
        />
        {RightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
            <RightIcon className="w-5 h-5 text-surface-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-error-600 dark:text-error-400 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
