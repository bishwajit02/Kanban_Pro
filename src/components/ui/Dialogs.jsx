import React, { useEffect, useState } from "react";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";

/** Modal asking for a single text value, with optional live validation. */
export const PromptDialog = ({
  isOpen,
  onClose,
  title,
  description,
  label,
  initialValue = "",
  placeholder,
  submitLabel = "Save",
  validate,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
    }
  }, [isOpen, initialValue]);

  const liveError = value.trim() && validate ? validate(value) : null;

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate?.(value) ?? (value.trim() ? null : "This can't be empty.");
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="prompt-dialog" isLoading={busy} disabled={!!liveError}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="prompt-dialog" onSubmit={submit}>
        <Input
          label={label}
          autoFocus
          value={value}
          placeholder={placeholder}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          error={error || liveError}
        />
      </form>
    </Modal>
  );
};

export const ConfirmDialog = ({ isOpen, onClose, title, description, confirmLabel = "Delete", onConfirm }) => {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} isLoading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">{description}</p>
    </Modal>
  );
};
