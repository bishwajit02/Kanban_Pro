import React from "react";
import Card from "./Card";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { FaPlus, FaEllipsisH } from "react-icons/fa";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

const Column = ({
  columnId,
  title,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
}) => {
  const getColumnColor = (title) => {
    switch (title) {
      case "To Do":
        return "bg-surface-400";
      case "In Progress":
        return "bg-primary-500";
      case "Done":
        return "bg-success-500";
      default:
        return "bg-surface-400";
    }
  };

  return (
    <div className="w-80 md:w-96 flex-shrink-0 flex flex-col h-full max-h-screen">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getColumnColor(title)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
          <h2 className="font-black text-lg text-surface-900 dark:text-surface-100 uppercase tracking-wider">
            {title}
          </h2>
          <Badge variant="surface" size="sm" className="font-bold">
            {cards.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddCard(columnId)}
            className="p-2 rounded-xl"
            title="Add task"
          >
            <FaPlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 rounded-xl text-surface-400"
          >
            <FaEllipsisH className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cards Area */}
      <Droppable droppableId={String(columnId)} type="CARD">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-2 pb-10 space-y-4 custom-scrollbar transition-colors duration-200 rounded-2xl ${
              snapshot.isDraggingOver
                ? "bg-primary-50/30 dark:bg-primary-900/10"
                : ""
            }`}
          >
            {cards.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl text-surface-400 dark:text-surface-600">
                <FaPlus className="w-6 h-6 mb-2 opacity-20" />
                <p className="text-sm font-bold opacity-40">Drop tasks here</p>
              </div>
            ) : (
              cards.map((card, cardIdx) => (
                <Draggable
                  key={card.id}
                  draggableId={String(card.id)}
                  index={cardIdx}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${snapshot.isDragging ? "z-50 shadow-2xl" : ""}`}
                    >
                      <Card
                        content={card.content}
                        dueDate={card.dueDate}
                        githubLink={card.githubLink}
                        tags={card.tags}
                        priority={card.priority}
                        images={card.images}
                        onClick={() => onEditCard(columnId, card)}
                        onDelete={() => onDeleteCard(columnId, card.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
