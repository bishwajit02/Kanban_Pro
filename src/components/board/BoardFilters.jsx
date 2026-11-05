import React, { forwardRef } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "../../lib/utils";
import Button from "../ui/Button";
import Input from "../ui/Input";

const priorityOptions = [
  { value: "All", dot: null },
  { value: "High", dot: "bg-error-500" },
  { value: "Medium", dot: "bg-warning-500" },
  { value: "Low", dot: "bg-success-500" },
];

const BoardFilters = forwardRef(
  ({ searchTerm, setSearchTerm, priority, setPriority, isFiltering, onClear }, searchRef) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        ref={searchRef}
        type="search"
        aria-label="Search tasks"
        placeholder="Search tasks, descriptions, assignees…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchTerm("");
            e.currentTarget.blur();
          }
        }}
        leftIcon={FiSearch}
        rightElement={!searchTerm && <kbd className="kbd mr-1">/</kbd>}
        containerClassName="sm:max-w-sm flex-1"
      />

      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        <span className="mr-1 text-xs text-surface-500">Priority</span>
        {priorityOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={priority === opt.value}
            onClick={() => setPriority(opt.value)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors",
              priority === opt.value
                ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300"
                : "border-surface-200 bg-white text-surface-600 hover:border-surface-300 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-400 dark:hover:border-surface-700"
            )}
          >
            {opt.dot && <span className={cn("h-1.5 w-1.5 rounded-full", opt.dot)} />}
            {opt.value}
          </button>
        ))}
        {isFiltering && (
          <Button variant="ghost" size="sm" leftIcon={FiX} onClick={onClear} className="ml-1">
            Clear
          </Button>
        )}
      </div>
    </div>
  )
);
BoardFilters.displayName = "BoardFilters";

export default BoardFilters;
