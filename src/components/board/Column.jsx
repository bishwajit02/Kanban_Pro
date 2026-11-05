import React, { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { FiEdit2, FiMoreHorizontal, FiPlus, FiTrash2 } from "react-icons/fi";
import { cn } from "../../lib/utils";
import Menu, { MenuItem, MenuSeparator } from "../ui/Menu";
import TaskCard from "./Card";

const ACCENTS = ["bg-surface-400", "bg-primary-500", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];

const accentFor = (title, index, isDone) => {
  if (isDone) return "bg-success-500";
  const t = title.trim().toLowerCase();
  if (t === "to do" || t === "todo" || t === "backlog") return "bg-surface-400";
  if (t === "in progress" || t === "doing") return "bg-primary-500";
  return ACCENTS[index % ACCENTS.length];
};

const Column = ({
  column,
  index,
  isDone,
  isDragging,
  dragHandleProps,
  dragDisabled,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onRename,
  onDelete,
}) => {
  const [draft, setDraft] = useState(null);

  const commitRename = () => {
    if (draft?.trim() && draft.trim() !== column.title) onRename(draft.trim());
    setDraft(null);
  };

  return (
    <section
      aria-label={column.title}
      className={cn(
        "flex max-h-full w-72 flex-col rounded-xl border border-surface-200/70 bg-surface-100/70 transition-shadow sm:w-80 dark:border-surface-800/70 dark:bg-surface-900/50",
        isDragging && "shadow-pop ring-1 ring-primary-500/30"
      )}
    >
      {/* Header — doubles as the drag handle for reordering columns */}
      <div {...dragHandleProps} className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", accentFor(column.title, index, isDone))} />
        {draft !== null ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setDraft(null);
            }}
            className="min-w-0 flex-1 rounded-md bg-white px-1.5 py-0.5 text-sm font-semibold outline-none ring-2 ring-primary-500/40 dark:bg-surface-800"
          />
        ) : (
          <h2
            onDoubleClick={() => setDraft(column.title)}
            className="min-w-0 flex-1 truncate text-sm font-semibold text-surface-800 dark:text-surface-100"
          >
            {column.title}
          </h2>
        )}
        <span className="rounded-md bg-surface-200/70 px-1.5 text-xs font-medium text-surface-600 tabular-nums dark:bg-surface-800 dark:text-surface-400">
          {column.cards.length}
        </span>
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          aria-label={`Add task to ${column.title}`}
          className="rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <FiPlus className="h-4 w-4" />
        </button>
        <Menu
          trigger={({ toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-label="Column options"
              className="rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-200 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200"
            >
              <FiMoreHorizontal className="h-4 w-4" />
            </button>
          )}
        >
          <MenuItem icon={FiPlus} onClick={() => onAddCard(column.id)}>
            Add task
          </MenuItem>
          <MenuItem icon={FiEdit2} onClick={() => setDraft(column.title)}>
            Rename column
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={FiTrash2} danger onClick={onDelete}>
            Delete column
          </MenuItem>
        </Menu>
      </div>

      <Droppable droppableId={String(column.id)} type="CARD" isDropDisabled={dragDisabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "scrollbar-thin mx-1.5 min-h-24 flex-1 overflow-y-auto rounded-lg px-1.5 pb-1.5 transition-colors",
              snapshot.isDraggingOver && "bg-primary-500/5"
            )}
          >
            {column.cards.map((card, cardIdx) => (
              <Draggable key={card.id} draggableId={String(card.id)} index={cardIdx} isDragDisabled={dragDisabled}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className="pb-2"
                  >
                    <TaskCard
                      card={card}
                      isDone={isDone}
                      isDragging={dragSnapshot.isDragging}
                      onClick={() => onEditCard(column.id, card)}
                      onDelete={() => onDeleteCard(column.id, card.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {column.cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-surface-300 text-xs text-surface-400 dark:border-surface-700">
                {dragDisabled ? "No matching tasks" : "Drop tasks here"}
              </div>
            )}
          </div>
        )}
      </Droppable>

      {!dragDisabled && (
        <button
          type="button"
          onClick={() => onAddCard(column.id)}
          className="m-1.5 mt-0 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-surface-500 transition-colors hover:bg-surface-200/70 hover:text-surface-800 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <FiPlus className="h-3.5 w-3.5" />
          Add task
        </button>
      )}
    </section>
  );
};

export default Column;
