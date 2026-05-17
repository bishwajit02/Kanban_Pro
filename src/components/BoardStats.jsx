import React from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTasks,
} from "react-icons/fa";

const BoardStats = ({ stats }) => {
  const items = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: FaTasks,
      color: "text-primary-600 dark:text-primary-400",
      bg: "bg-primary-50 dark:bg-primary-900/20",
    },
    {
      label: "To Do",
      value: stats.todo,
      icon: FaClock,
      color: "text-warning-600 dark:text-warning-400",
      bg: "bg-warning-50 dark:bg-warning-900/20",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: FaClock,
      color: "text-primary-600 dark:text-primary-400",
      bg: "bg-primary-50 dark:bg-primary-900/20",
    },
    {
      label: "Completed",
      value: stats.done,
      icon: FaCheckCircle,
      color: "text-success-600 dark:text-success-400",
      bg: "bg-success-50 dark:bg-success-900/20",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: FaExclamationTriangle,
      color: "text-error-600 dark:text-error-400",
      bg: "bg-error-50 dark:bg-error-900/20",
    },
    {
      label: "High Priority",
      value: stats.highPriority,
      icon: FaExclamationTriangle,
      color: "text-error-600 dark:text-error-400",
      bg: "bg-error-50 dark:bg-error-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
      {items.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white dark:bg-surface-900 p-6 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${item.bg} transition-transform duration-300 group-hover:scale-110`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="text-3xl font-black text-surface-900 dark:text-surface-100">
              {item.value}
            </div>
          </div>
          <div className="text-sm font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default BoardStats;
