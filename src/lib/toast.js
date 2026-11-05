import { useSyncExternalStore } from "react";

let toasts = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const dismissToast = (id) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

/**
 * Show a toast. `action` is an optional { label, onClick } pair (e.g. Undo).
 */
export const toast = (message, { tone = "default", action, duration = 4000 } = {}) => {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, message, tone, action }].slice(-4);
  emit();
  setTimeout(() => dismissToast(id), duration);
  return id;
};

toast.success = (message, opts) => toast(message, { ...opts, tone: "success" });
toast.error = (message, opts) => toast(message, { ...opts, tone: "error", duration: 6000 });

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useToasts = () => useSyncExternalStore(subscribe, () => toasts);
