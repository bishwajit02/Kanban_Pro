import React from "react";
import { FiAlignLeft, FiCalendar, FiGithub, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { cn, describeDueDate, priorityVariant, safeUrl } from "../../lib/utils";
import { AvatarStack } from "../ui/Avatar";
import Badge from "../ui/Badge";

const dueTone = {
  error: "text-error-600 bg-error-50 dark:text-error-400 dark:bg-error-500/10",
  warning: "text-warning-700 bg-warning-50 dark:text-warning-400 dark:bg-warning-500/10",
  neutral: "text-surface-500 dark:text-surface-400",
};

const TaskCard = ({ card, isDone, isDragging, onClick, onDelete }) => {
  const due = describeDueDate(card.dueDate);
  const github = safeUrl(card.githubLink);
  const images = card.images || [];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg border border-surface-200 bg-white text-left shadow-card transition-all hover:border-surface-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700",
        isDragging && "rotate-1 shadow-pop ring-1 ring-primary-500/40"
      )}
    >
      {images[0] && <img src={images[0]} alt="" className="h-28 w-full object-cover" draggable={false} />}

      <div className="space-y-2.5 p-3">
        <div className="flex items-start gap-2">
          <h3
            className={cn(
              "flex-1 text-sm leading-snug font-medium text-surface-900 dark:text-surface-100",
              isDone && "text-surface-500 line-through decoration-surface-300 dark:text-surface-500"
            )}
          >
            {card.content}
          </h3>
          <button
            type="button"
            aria-label="Delete task"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="-mt-0.5 -mr-1 rounded-md p-1 text-surface-400 opacity-0 transition hover:bg-error-50 hover:text-error-600 group-hover:opacity-100 focus-visible:opacity-100 dark:hover:bg-error-500/10"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {card.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-surface-500 dark:text-surface-400">
            {card.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {card.priority && (
            <Badge variant={priorityVariant(card.priority)} dot>
              {card.priority}
            </Badge>
          )}
          {due && !isDone && (
            <span
              className={cn(
                "inline-flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium",
                dueTone[due.tone]
              )}
            >
              <FiCalendar className="h-3 w-3" />
              {due.label}
            </span>
          )}
        </div>

        {(card.tags?.length > 0 || images.length > 0 || github || card.description) && (
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2.5 text-surface-400">
              {card.description && <FiAlignLeft className="h-3.5 w-3.5" title="Has description" />}
              {images.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px]">
                  <FiPaperclip className="h-3.5 w-3.5" />
                  {images.length}
                </span>
              )}
              {github && (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Open GitHub link"
                  className="rounded p-0.5 hover:text-surface-800 dark:hover:text-surface-200"
                >
                  <FiGithub className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <AvatarStack names={card.tags || []} size="xs" />
          </div>
        )}
      </div>
    </article>
  );
};

export default TaskCard;
