export const STICKY_COLORS = {
  yellow: "bg-amber-100 text-amber-950 dark:bg-amber-300 dark:text-amber-950",
  pink: "bg-pink-100 text-pink-950 dark:bg-pink-300 dark:text-pink-950",
  green: "bg-emerald-100 text-emerald-950 dark:bg-emerald-300 dark:text-emerald-950",
  blue: "bg-sky-100 text-sky-950 dark:bg-sky-300 dark:text-sky-950",
  purple: "bg-violet-100 text-violet-950 dark:bg-violet-300 dark:text-violet-950",
};

export const STICKY_SWATCHES = {
  yellow: "bg-amber-300",
  pink: "bg-pink-300",
  green: "bg-emerald-300",
  blue: "bg-sky-300",
  purple: "bg-violet-300",
};

/** Older local ideas stored a Tailwind class object; newer items store a key. */
export const stickyKey = (color) => {
  const key = typeof color === "string" ? color : color?.label?.toLowerCase();
  return STICKY_COLORS[key] ? key : "yellow";
};
