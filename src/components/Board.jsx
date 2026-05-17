import React from "react";
import Column from "./Column";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";

const Board = ({ board, onAddCard, onEditCard, onDeleteCard, onDragEnd }) => {
  if (!board) return null;

  return (
    <div className="flex-1 overflow-hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="COLUMN"
        >
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex gap-8 px-6 md:px-10 h-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-6"
            >
              {board.map((column, index) => (
                <div key={column.id} className="h-full">
                  <Column
                    columnId={column.id}
                    title={column.title}
                    cards={column.cards}
                    onAddCard={onAddCard}
                    onEditCard={onEditCard}
                    onDeleteCard={onDeleteCard}
                  />
                </div>
              ))}
              {provided.placeholder}
              
              {/* Add Column Placeholder */}
              <div className="w-80 md:w-96 flex-shrink-0 flex flex-col h-full">
                <button className="h-14 flex items-center gap-3 px-4 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-700 text-surface-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-300 font-bold uppercase tracking-wider text-sm">
                  <div className="w-6 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
                    +
                  </div>
                  Add Column
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Board;
