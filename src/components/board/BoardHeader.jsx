import React, { useState } from "react";
import { FiAlertCircle, FiCheck, FiColumns, FiList, FiPlus } from "react-icons/fi";
import { cn } from "../../lib/utils";
import PageHeader from "../layout/PageHeader";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

/** Text that turns into an input on click and commits on blur / Enter. */
const InlineEdit = ({ value, onCommit, placeholder, className, inputClassName, allowEmpty = false }) => {
  const [draft, setDraft] = useState(null);
  const editing = draft !== null;

  const commit = () => {
    const next = draft.trim();
    setDraft(null);
    if ((next || allowEmpty) && next !== value) onCommit(next);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(null);
        }}
        className={cn(
          "-mx-1.5 w-full rounded-md bg-transparent px-1.5 outline-none ring-2 ring-primary-500/40",
          inputClassName
        )}
      />
    );
  }

  return (
    <button
      type="button"
      title="Click to edit"
      onClick={() => setDraft(value)}
      className={cn(
        "-mx-1.5 block max-w-full truncate rounded-md px-1.5 text-left transition-colors hover:bg-surface-100 dark:hover:bg-surface-800",
        !value && "text-surface-400",
        className
      )}
    >
      {value || placeholder}
    </button>
  );
};

const SaveIndicator = ({ state }) => {
  const content = {
    saving: [<Spinner key="i" className="h-3 w-3" />, "Saving…"],
    saved: [<FiCheck key="i" className="h-3 w-3 text-success-500" />, "Saved"],
    error: [<FiAlertCircle key="i" className="h-3 w-3 text-error-500" />, "Not saved"],
  }[state];
  return (
    <span className="hidden items-center gap-1.5 text-xs text-surface-500 sm:inline-flex" aria-live="polite">
      {content}
    </span>
  );
};

const views = [
  { id: "kanban", label: "Board", icon: FiColumns },
  { id: "table", label: "Table", icon: FiList },
];

const BoardHeader = ({ name, description, onRename, onDescribe, view, setView, saveState, onAddTask }) => (
  <PageHeader
    title={
      <InlineEdit
        value={name}
        onCommit={onRename}
        placeholder="Untitled board"
        className="text-xl font-semibold tracking-tight text-surface-900 dark:text-surface-50"
        inputClassName="text-xl font-semibold tracking-tight"
      />
    }
    description={
      <InlineEdit
        value={description}
        onCommit={onDescribe}
        allowEmpty
        placeholder="Add a description"
        className="mt-1 text-sm text-surface-500 dark:text-surface-400"
        inputClassName="mt-1 text-sm"
      />
    }
    actions={
      <>
        <SaveIndicator state={saveState} />
        <div className="flex rounded-lg bg-surface-100 p-0.5 dark:bg-surface-900" role="tablist">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
                view === v.id
                  ? "bg-white text-surface-900 shadow-xs dark:bg-surface-800 dark:text-surface-50"
                  : "text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
              )}
            >
              <v.icon className="h-3.5 w-3.5" />
              {v.label}
            </button>
          ))}
        </div>
        <Button leftIcon={FiPlus} onClick={onAddTask} title="New task (N)">
          New task
        </Button>
      </>
    }
  />
);

export default BoardHeader;
