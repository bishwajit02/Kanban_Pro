import React from "react";
import { FaTrash, FaGithub, FaCalendarAlt, FaUser, FaLink } from "react-icons/fa";
import { motion } from "framer-motion";
import Badge from "./ui/Badge";
import CardUI from "./ui/Card";

const Card = ({
  content,
  dueDate,
  githubLink,
  tags,
  priority,
  images,
  onClick,
  onDelete,
}) => {
  const getPriorityVariant = (priority) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "surface";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays <= 7) return `${diffDays} days left`;
    return date.toLocaleDateString();
  };

  const overdue = dueDate && new Date(dueDate) < new Date();

  return (
    <CardUI
      hoverable
      onClick={onClick}
      className="group relative overflow-hidden bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Priority Ribbon */}
      <div
        className={`absolute top-0 left-0 w-1.5 h-full ${
          priority === "High"
            ? "bg-error-500"
            : priority === "Medium"
            ? "bg-warning-500"
            : "bg-success-500"
        }`}
      />

      {/* Card Image Cover (if any) */}
      {images && images.length > 0 && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={images[0]}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Priority & Delete */}
        <div className="flex items-center justify-between">
          <Badge
            variant={getPriorityVariant(priority)}
            size="sm"
            dot
            className="font-bold uppercase tracking-wider px-2 py-0.5"
          >
            {priority}
          </Badge>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-surface-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <FaTrash className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {content}
        </h3>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          {dueDate && (
            <Badge
              variant={overdue ? "error" : "surface"}
              size="sm"
              icon={FaCalendarAlt}
              className="font-semibold"
            >
              {formatDate(dueDate)}
            </Badge>
          )}

          {githubLink && (
            <a
              href={githubLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            >
              <FaGithub className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Assignees */}
        {tags && tags.length > 0 && (
          <div className="flex items-center -space-x-2 pt-1">
            {tags.slice(0, 3).map((tag, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-900 bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden shadow-sm"
                title={tag}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tag)}&background=random`}
                  alt={tag}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {tags.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-900 bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-bold text-surface-500 shadow-sm">
                +{tags.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interaction Overlay */}
      <div className="absolute inset-0 ring-2 ring-inset ring-primary-500/0 group-hover:ring-primary-500/20 rounded-2xl pointer-events-none transition-all" />
    </CardUI>
  );
};

export default Card;
