import React, { useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { FiPlus } from "react-icons/fi";
import Button from "../ui/Button";
import Column from "./Column";

const AddColumn = ({ onAdd }) => {
  const [title, setTitle] = useState(null);

  if (title === null) {
    return (
      <button
        type="button"
        onClick={() => setTitle("")}
        className="flex h-11 w-72 shrink-0 items-center gap-2 rounded-xl border border-dashed border-surface-300 px-3 text-sm text-surface-500 transition-colors hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600 dark:border-surface-700 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/5 dark:hover:text-primary-400"
      >
        <FiPlus className="h-4 w-4" />
        Add column
      </button>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (title.trim()) onAdd(title.trim());
    setTitle(null);
  };

  return (
    <form
      onSubmit={submit}
      className="w-72 shrink-0 space-y-2 rounded-xl border border-surface-200 bg-white p-2 shadow-card dark:border-surface-800 dark:bg-surface-900"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setTitle(null)}
        placeholder="Column name"
        className="field"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add column
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setTitle(null)}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

const Board = ({
  board,
  dragDisabled,
  doneColumnId,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDragEnd,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
}) => (
  <DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="board" direction="horizontal" type="COLUMN" isDropDisabled={dragDisabled}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="scrollbar-thin flex h-full flex-1 items-start overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8"
        >
          {board.map((column, index) => (
            <Draggable
              key={column.id}
              draggableId={`col-${column.id}`}
              index={index}
              isDragDisabled={dragDisabled}
            >
              {(dragProvided, snapshot) => (
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  className="mr-4 flex h-full shrink-0"
                >
                  <Column
                    column={column}
                    index={index}
                    isDone={column.id === doneColumnId}
                    isDragging={snapshot.isDragging}
                    dragHandleProps={dragProvided.dragHandleProps}
                    dragDisabled={dragDisabled}
                    onAddCard={onAddCard}
                    onEditCard={onEditCard}
                    onDeleteCard={onDeleteCard}
                    onRename={(title) => onRenameColumn(column.id, title)}
                    onDelete={() => onDeleteColumn(column.id)}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          {!dragDisabled && <AddColumn onAdd={onAddColumn} />}
        </div>
      )}
    </Droppable>
  </DragDropContext>
);

export default Board;
