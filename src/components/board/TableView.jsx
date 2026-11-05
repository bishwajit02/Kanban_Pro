import React from "react";
import { FiEdit2, FiGithub, FiInbox, FiPlus, FiTrash2 } from "react-icons/fi";
import { cn, describeDueDate, priorityVariant, safeUrl } from "../../lib/utils";
import { AvatarStack } from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const dueText = {
  error: "text-error-600 dark:text-error-400",
  warning: "text-warning-700 dark:text-warning-400",
  neutral: "text-surface-600 dark:text-surface-400",
};

const TableView = ({ board, isFiltering, onEditCard, onDeleteCard, onAddCard }) => {
  const rows = board.flatMap((col) => col.cards.map((card) => ({ card, column: col })));

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-card dark:border-surface-800 dark:bg-surface-900">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-xs text-surface-500 dark:border-surface-800 dark:bg-surface-950/40">
                <th className="px-4 py-2.5 font-medium">Task</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Due</th>
                <th className="px-4 py-2.5 font-medium">Assignees</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <FiInbox className="mx-auto mb-3 h-6 w-6 text-surface-300" />
                    <p className="font-medium text-surface-700 dark:text-surface-300">
                      {isFiltering ? "No tasks match your filters" : "No tasks yet"}
                    </p>
                    <p className="mt-1 mb-4 text-sm text-surface-500">
                      {isFiltering ? "Try a different search or priority." : "Create your first task to get going."}
                    </p>
                    {!isFiltering && (
                      <Button size="sm" leftIcon={FiPlus} onClick={onAddCard}>
                        New task
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map(({ card, column }) => {
                  const due = describeDueDate(card.dueDate);
                  const github = safeUrl(card.githubLink);
                  return (
                    <tr
                      key={card.id}
                      onClick={() => onEditCard(column.id, card)}
                      className="group cursor-pointer transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/40"
                    >
                      <td className="max-w-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-surface-900 dark:text-surface-100">
                            {card.content}
                          </span>
                          {github && (
                            <a
                              href={github}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Open GitHub link"
                              className="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                            >
                              <FiGithub className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {card.description && (
                          <p className="mt-0.5 truncate text-xs text-surface-500">{card.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{column.title}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {card.priority && (
                          <Badge variant={priorityVariant(card.priority)} dot>
                            {card.priority}
                          </Badge>
                        )}
                      </td>
                      <td className={cn("px-4 py-3 text-xs whitespace-nowrap", due ? dueText[due.tone] : "text-surface-400")}>
                        {due ? due.label : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {card.tags?.length ? (
                          <AvatarStack names={card.tags} size="sm" />
                        ) : (
                          <span className="text-xs text-surface-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconOnly
                            aria-label="Edit task"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditCard(column.id, card);
                            }}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="danger-ghost"
                            size="sm"
                            iconOnly
                            aria-label="Delete task"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCard(column.id, card.id);
                            }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableView;
