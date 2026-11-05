import { useSyncExternalStore } from "react";

const STORAGE_KEY = "kp-theme";
const THEMES = ["light", "dark", "system"];
const listeners = new Set();
const media = window.matchMedia("(prefers-color-scheme: dark)");

const readStored = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(value) ? value : "system";
  } catch {
    return "system";
  }
};

let current = readStored();

const apply = () => {
  const dark = current === "dark" || (current === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
};

media.addEventListener("change", () => {
  if (current === "system") {
    apply();
    listeners.forEach((l) => l());
  }
});

apply();

export const setTheme = (theme) => {
  if (!THEMES.includes(theme)) return;
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable: the choice still applies for this session.
  }
  apply();
  listeners.forEach((l) => l());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, () => current);
  const resolved =
    theme === "system" ? (media.matches ? "dark" : "light") : theme;
  return { theme, resolved, setTheme };
};
