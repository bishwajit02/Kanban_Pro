import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiFlag, FiLayers } from "react-icons/fi";
import { cn } from "../../lib/utils";

const Stat = ({ label, value, icon: Icon, tone, children }) => (
  <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-card dark:border-surface-800 dark:bg-surface-900">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{label}</p>
      <Icon className={cn("h-4 w-4", tone)} />
    </div>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-surface-900 tabular-nums dark:text-surface-50">
      {value}
    </p>
    {children}
  </div>
);

const BoardStats = ({ stats }) => {
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Open tasks" value={stats.open} icon={FiLayers} tone="text-primary-500">
        <p className="mt-1 text-xs text-surface-500">{stats.total} total on this board</p>
      </Stat>
      <Stat label="Completed" value={`${pct}%`} icon={FiCheckCircle} tone="text-success-500">
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div className="h-full rounded-full bg-success-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </Stat>
      <Stat label="Overdue" value={stats.overdue} icon={FiAlertTriangle} tone="text-error-500">
        <p className="mt-1 text-xs text-surface-500">
          {stats.dueSoon ? `${stats.dueSoon} more due in 2 days` : "Nothing due in 2 days"}
        </p>
      </Stat>
      <Stat label="High priority" value={stats.highPriority} icon={FiFlag} tone="text-warning-500">
        <p className="mt-1 text-xs text-surface-500">Open tasks flagged high</p>
      </Stat>
    </div>
  );
};

export default BoardStats;
