import React, { useState } from "react";
import { FiCheck, FiCornerDownLeft, FiRotateCcw, FiTrash2, FiX } from "react-icons/fi";
import { cn } from "../../lib/utils";
import Avatar from "../ui/Avatar";

const unscaled = { transform: "scale(calc(1 / var(--z)))", transformOrigin: "bottom left" };
const stop = (e) => e.stopPropagation();

const timeAgo = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date) return "now";
  const s = (Date.now() - date) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const Composer = ({ placeholder, onSubmit, onCancel, autoFocus = true }) => {
  const [text, setText] = useState("");
  const submit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
    }
  };
  return (
    <div className="flex items-end gap-2">
      <textarea
        autoFocus={autoFocus}
        rows={2}
        value={text}
        maxLength={2000}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") onCancel?.();
        }}
        className="field min-h-0 flex-1 resize-none py-1.5 text-sm"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim()}
        aria-label="Send"
        className="mb-0.5 rounded-lg bg-primary-600 p-2 text-white disabled:opacity-40"
      >
        <FiCornerDownLeft className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const Message = ({ name, text, time }) => (
  <div className="flex gap-2.5">
    <Avatar name={name} size="sm" />
    <div className="min-w-0 flex-1">
      <p className="text-xs">
        <span className="font-semibold text-surface-900 dark:text-surface-100">{name}</span>
        <span className="ml-1.5 text-surface-400">{timeAgo(time)}</span>
      </p>
      <p className="mt-0.5 text-sm break-words whitespace-pre-wrap text-surface-700 dark:text-surface-300">{text}</p>
    </div>
  </div>
);

const Popover = ({ children }) => (
  <div
    data-no-wheel
    onPointerDown={stop}
    className="absolute bottom-0 left-9 w-72 rounded-xl border border-surface-200 bg-white p-3 shadow-pop dark:border-surface-700 dark:bg-surface-900"
  >
    {children}
  </div>
);

const Pin = ({ comment, open, onClick }) => (
  <button
    type="button"
    onPointerDown={stop}
    onClick={onClick}
    aria-label={`Comment by ${comment.authorName}`}
    className={cn(
      "flex h-8 w-8 items-center justify-center rounded-full rounded-bl-none border-2 border-white shadow-md transition hover:scale-110 dark:border-surface-900",
      comment.resolved && "opacity-50",
      open && "ring-2 ring-primary-500"
    )}
  >
    <Avatar name={comment.authorName} size="md" className="h-full w-full rounded-bl-none" />
  </button>
);

const CommentLayer = ({
  comments,
  user,
  canComment,
  canEdit,
  showResolved,
  openId,
  setOpenId,
  draft,
  setDraft,
  onCreate,
  onReply,
  onResolve,
  onDelete,
}) => (
  <>
    {comments
      .filter((c) => showResolved || !c.resolved || c.id === openId)
      .map((c) => {
        const open = c.id === openId;
        const canDelete = canEdit || (canComment && c.authorUid === user.uid);
        return (
          <div key={c.id} className="absolute" style={{ left: c.x, top: c.y, zIndex: open ? 1e6 + 1 : 1e6 }}>
            <div className="absolute bottom-0 left-0" style={unscaled}>
              <Pin comment={c} open={open} onClick={() => setOpenId(open ? null : c.id)} />
              {open && (
                <Popover>
                  <div className="mb-2 flex items-center justify-end gap-0.5 text-surface-400">
                    {c.resolved && <span className="mr-auto text-xs text-success-600">Resolved{c.resolvedBy ? ` by ${c.resolvedBy}` : ""}</span>}
                    {canComment && (
                      <button
                        type="button"
                        onClick={() => onResolve(c, !c.resolved)}
                        title={c.resolved ? "Reopen" : "Resolve"}
                        className="rounded-md p-1.5 hover:bg-surface-100 hover:text-success-600 dark:hover:bg-surface-800"
                      >
                        {c.resolved ? <FiRotateCcw className="h-3.5 w-3.5" /> : <FiCheck className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        title="Delete thread"
                        className="rounded-md p-1.5 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenId(null)}
                      title="Close"
                      className="rounded-md p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="scrollbar-thin max-h-72 space-y-3 overflow-y-auto">
                    <Message name={c.authorName} text={c.text} time={c.createdAt} />
                    {(c.replies || []).map((r, i) => (
                      <Message key={i} name={r.authorName} text={r.text} time={r.createdAt} />
                    ))}
                  </div>
                  {canComment && (
                    <div className="mt-3">
                      <Composer placeholder="Reply…" onSubmit={(text) => onReply(c, text)} onCancel={() => setOpenId(null)} />
                    </div>
                  )}
                </Popover>
              )}
            </div>
          </div>
        );
      })}

    {draft && (
      <div className="absolute" style={{ left: draft.x, top: draft.y, zIndex: 1e6 + 2 }}>
        <div className="absolute bottom-0 left-0" style={unscaled}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full rounded-bl-none border-2 border-white bg-primary-600 shadow-md">
            <Avatar name={user.displayName || user.email} size="md" className="h-full w-full rounded-bl-none" />
          </div>
          <Popover>
            <Composer
              placeholder="Add a comment…"
              onSubmit={(text) => {
                onCreate({ x: draft.x, y: draft.y, text });
                setDraft(null);
              }}
              onCancel={() => setDraft(null)}
            />
          </Popover>
        </div>
      </div>
    )}
  </>
);

export default CommentLayer;
