import React from "react";
import { FaEdit, FaTrash, FaGithub, FaTag, FaFlag, FaColumns } from "react-icons/fa";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

const TableView = ({ board, onEditCard, onDeleteCard }) => {
  if (!board) return null;

  // Flatten all cards with their column info
  const rows = board.flatMap((col) =>
    col.cards.map((card) => ({ ...card, column: col.title, columnId: col.id }))
  );

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "High": return "error";
      case "Medium": return "warning";
      case "Low": return "success";
      default: return "surface";
    }
  };

  return (
    <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 text-xs font-black text-surface-400 uppercase tracking-widest">
              <th className="px-8 py-6">Task Details</th>
              <th className="px-6 py-6 text-center">Priority</th>
              <th className="px-6 py-6">Assigned</th>
              <th className="px-6 py-6">Status</th>
              <th className="px-6 py-6">Links</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-surface-400">
                    <div className="w-20 h-20 rounded-3xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                      <FaColumns className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-bold">No tasks found in this board</p>
                    <p className="text-sm">Switch back to board view or create a new task to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((card) => (
                <tr
                  key={card.id}
                  className="group hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="text-base font-bold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {card.content}
                      </div>
                      <div className="text-sm text-surface-500 dark:text-surface-400 line-clamp-1 max-w-md">
                        {card.description || "No description provided"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex justify-center">
                      <Badge
                        variant={getPriorityVariant(card.priority)}
                        dot
                        size="sm"
                        className="font-black uppercase tracking-tighter"
                      >
                        {card.priority}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center -space-x-2">
                      {(card.tags || []).length > 0 ? (
                        card.tags.slice(0, 3).map((tag, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-900 shadow-sm"
                            title={tag}
                          >
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tag)}&background=random`}
                              alt={tag}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        ))
                      ) : (
                        <span className="text-xs font-bold text-surface-300 uppercase tracking-widest">Unassigned</span>
                      )}
                      {(card.tags || []).length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 border-2 border-white dark:border-surface-900 flex items-center justify-center text-[10px] font-black text-surface-500 shadow-sm">
                          +{(card.tags || []).length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <Badge variant="surface" className="font-bold border-2">
                      {card.column}
                    </Badge>
                  </td>
                  <td className="px-6 py-6">
                    {card.githubLink ? (
                      <a
                        href={card.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <FaGithub className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Source</span>
                      </a>
                    ) : (
                      <span className="text-surface-300">—</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCard(card.columnId, card)}
                        className="p-2 rounded-xl text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <FaEdit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCard(card.columnId, card.id)}
                        className="p-2 rounded-xl text-surface-400 hover:text-error-500"
                      >
                        <FaTrash className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
