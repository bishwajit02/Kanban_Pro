import React from "react";
import { motion } from "framer-motion";
import { FaTrello, FaTable, FaPlus } from "react-icons/fa";
import Button from "./ui/Button";

const BoardHeader = ({
  boardName,
  boardDescription,
  onEditName,
  onEditDesc,
  editingName,
  editingDesc,
  setBoardName,
  setBoardDescription,
  setEditingName,
  setEditingDesc,
  view,
  setView,
  onAddTask,
}) => {
  return (
    <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 shadow-sm">
      <div className="container mx-auto py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="flex-1 min-w-0 space-y-3">
            {editingName ? (
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingName(false);
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="text-4xl md:text-5xl font-black bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-500 rounded-xl px-4 py-2 w-full -ml-4"
                autoFocus
              />
            ) : (
              <h1
                className="text-4xl md:text-5xl font-black text-surface-900 dark:text-surface-100 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl px-4 py-2 -ml-4 transition-all duration-200"
                onClick={() => setEditingName(true)}
              >
                {boardName}
              </h1>
            )}
            
            {editingDesc ? (
              <input
                type="text"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                onBlur={() => setEditingDesc(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingDesc(false);
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                className="text-lg text-surface-500 dark:text-surface-400 bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-500 rounded-xl px-4 py-2 w-full -ml-4 font-medium"
                autoFocus
              />
            ) : (
              <p
                className="text-lg text-surface-500 dark:text-surface-400 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl px-4 py-2 -ml-4 transition-all duration-200 font-medium"
                onClick={() => setEditingDesc(true)}
              >
                {boardDescription}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-2xl p-1.5 shadow-inner">
              <button
                onClick={() => setView("kanban")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                  view === "kanban"
                    ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-md transform scale-[1.02]"
                    : "text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                }`}
              >
                <FaTrello className="w-4 h-4" />
                Board
              </button>
              <button
                onClick={() => setView("table")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                  view === "table"
                    ? "bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-md transform scale-[1.02]"
                    : "text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                }`}
              >
                <FaTable className="w-4 h-4" />
                Table
              </button>
            </div>

            <Button
              size="lg"
              leftIcon={FaPlus}
              onClick={onAddTask}
              className="rounded-2xl shadow-lg shadow-primary-500/20"
            >
              New Task
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BoardHeader;
