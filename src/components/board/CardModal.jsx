import React, { useEffect, useRef, useState } from "react";
import { FiImage, FiTrash2, FiX } from "react-icons/fi";
import { toast } from "../../lib/toast";
import { cn, PRIORITIES, readImageFile, safeUrl } from "../../lib/utils";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Input, { Select, Textarea } from "../ui/Input";
import Modal from "../ui/Modal";

const MAX_IMAGES = 4;

const priorityStyles = {
  Low: "data-[active=true]:bg-success-500 data-[active=true]:text-white data-[active=true]:border-success-500",
  Medium: "data-[active=true]:bg-warning-500 data-[active=true]:text-white data-[active=true]:border-warning-500",
  High: "data-[active=true]:bg-error-500 data-[active=true]:text-white data-[active=true]:border-error-500",
};

const blankForm = {
  content: "",
  description: "",
  githubLink: "",
  images: [],
  tags: [],
  priority: "Medium",
  dueDate: "",
};

/** Collect every assignee already used on the board, for suggestions. */
const knownAssignees = (columns) =>
  [...new Set(columns.flatMap((c) => c.cards.flatMap((card) => card.tags || [])))].sort();

const CardModal = ({ isOpen, onClose, onSave, onDelete, card, columnId, columns = [] }) => {
  const [form, setForm] = useState(blankForm);
  const [status, setStatus] = useState(columnId);
  const [assigneeInput, setAssigneeInput] = useState("");
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(card ? { ...blankForm, ...card } : blankForm);
    setStatus(columnId);
    setAssigneeInput("");
    setErrors({});
  }, [card, columnId, isOpen]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const suggestions = assigneeInput.trim()
    ? knownAssignees(columns).filter(
        (name) =>
          name.toLowerCase().includes(assigneeInput.trim().replace(/^@/, "").toLowerCase()) &&
          !form.tags.includes(name)
      )
    : [];

  const addAssignee = (name) => {
    const clean = name.trim().replace(/^@/, "");
    if (clean && !form.tags.includes(clean)) setForm((f) => ({ ...f, tags: [...f.tags, clean] }));
    setAssigneeInput("");
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const room = MAX_IMAGES - form.images.length;
    if (files.length > room) toast.error(`You can attach up to ${MAX_IMAGES} images per task.`);
    setUploading(true);
    const results = await Promise.allSettled(files.slice(0, Math.max(room, 0)).map((f) => readImageFile(f)));
    setUploading(false);
    const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    results.filter((r) => r.status === "rejected").forEach((r) => toast.error(r.reason.message));
    if (ok.length) setForm((f) => ({ ...f, images: [...f.images, ...ok] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.content.trim()) next.content = "Give the task a title.";
    const github = form.githubLink.trim() ? safeUrl(form.githubLink) : "";
    if (github === null) next.githubLink = "Enter a valid http(s) link.";
    setErrors(next);
    if (Object.keys(next).length) return;

    onSave({
      columnId: status,
      content: form.content.trim(),
      description: form.description.trim(),
      githubLink: github,
      images: form.images,
      tags: form.tags,
      priority: form.priority,
      dueDate: form.dueDate,
    });
  };

  const footer = (
    <>
      {onDelete && (
        <Button variant="danger-ghost" leftIcon={FiTrash2} onClick={onDelete} className="mr-auto">
          Delete
        </Button>
      )}
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="task-form" disabled={uploading}>
        {card ? "Save changes" : "Create task"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={card ? "Edit task" : "New task"}
      description={card ? undefined : "Capture the work, then drag it across the board as it moves."}
      footer={footer}
      size="lg"
    >
      <form id="task-form" onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_15rem]">
        <div className="min-w-0 space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Design onboarding flow"
            value={form.content}
            onChange={set("content")}
            error={errors.content}
            autoFocus
          />
          <Textarea
            label="Description"
            placeholder="Add context, acceptance criteria, links…"
            value={form.description}
            onChange={set("description")}
            rows={5}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="field-label mb-0">
                Attachments <span className="text-surface-400">({form.images.length}/{MAX_IMAGES})</span>
              </span>
              {form.images.length < MAX_IMAGES && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={FiImage}
                  isLoading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add image
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImages}
              />
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-surface-200 dark:border-surface-800"
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                      className="absolute top-1 right-1 rounded-md bg-surface-950/60 p-1 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-surface-300 py-5 text-xs text-surface-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-surface-700"
              >
                <FiImage className="h-4 w-4" />
                Attach screenshots or mockups
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4 rounded-xl bg-surface-50 p-4 md:self-start dark:bg-surface-950/50">
          <Select
            label="Status"
            value={String(status ?? "")}
            // Legacy boards use numeric column ids, so map the string back to the real id.
            onChange={(e) => setStatus(columns.find((c) => String(c.id) === e.target.value)?.id)}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>

          <div>
            <span className="field-label">Priority</span>
            <div className="grid grid-cols-3 gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  data-active={form.priority === p}
                  onClick={() => setForm((f) => ({ ...f, priority: p }))}
                  className={cn(
                    "h-8 rounded-md border border-surface-200 bg-white text-xs font-medium text-surface-600 transition-colors hover:border-surface-300 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300",
                    priorityStyles[p]
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <Input label="Due date" type="date" value={form.dueDate} onChange={set("dueDate")} />

          <div className="relative">
            <Input
              label="Assignees"
              placeholder="Type a name, press Enter"
              value={assigneeInput}
              onChange={(e) => setAssigneeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addAssignee(assigneeInput);
                }
              }}
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-surface-200 bg-white p-1 shadow-pop dark:border-surface-800 dark:bg-surface-900">
                {suggestions.slice(0, 5).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addAssignee(name)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    <Avatar name={name} size="xs" />
                    {name}
                  </button>
                ))}
              </div>
            )}
            {form.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.tags.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white py-0.5 pr-1 pl-0.5 text-xs dark:border-surface-800 dark:bg-surface-900"
                  >
                    <Avatar name={name} size="xs" />
                    {name}
                    <button
                      type="button"
                      aria-label={`Remove ${name}`}
                      onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== name) }))}
                      className="rounded-full p-0.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Input
            label="GitHub link"
            placeholder="github.com/org/repo/pull/42"
            value={form.githubLink}
            onChange={set("githubLink")}
            error={errors.githubLink}
          />
        </aside>
      </form>
    </Modal>
  );
};

export default CardModal;
