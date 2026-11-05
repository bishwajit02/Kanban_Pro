export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const PRIORITIES = ["Low", "Medium", "High"];

export const priorityVariant = (priority) =>
  ({ High: "error", Medium: "warning", Low: "success" })[priority] || "neutral";

export const newId = () => crypto.randomUUID();

/** Parse a "YYYY-MM-DD" string as a local date (new Date(str) would treat it as UTC). */
export const parseLocalDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** Whole days from today until the given date (negative when in the past). */
export const daysUntil = (value) => {
  const date = parseLocalDate(value);
  if (!date) return null;
  return Math.round((date - startOfToday()) / 86_400_000);
};

export const describeDueDate = (value) => {
  const days = daysUntil(value);
  if (days === null) return null;
  if (days < -1) return { label: `${-days} days overdue`, tone: "error" };
  if (days === -1) return { label: "Due yesterday", tone: "error" };
  if (days === 0) return { label: "Due today", tone: "warning" };
  if (days === 1) return { label: "Due tomorrow", tone: "warning" };
  if (days <= 7) return { label: `Due in ${days} days`, tone: "neutral" };
  return {
    label: parseLocalDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tone: "neutral",
  };
};

/**
 * Normalise user-entered URLs: adds https:// when no scheme is present and
 * rejects anything that isn't http(s), so values like "javascript:" never
 * reach an href.
 */
export const safeUrl = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    const hostOk = url.hostname.includes(".") || url.hostname === "localhost";
    return (url.protocol === "http:" || url.protocol === "https:") && hostOk ? url.href : null;
  } catch {
    return null;
  }
};

export const youtubeId = (url) => {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      return u.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Read an image file and downscale it to a JPEG data URL. Keeps attachments
 * small enough for Firestore's 1 MB document limit and localStorage quotas.
 */
export const readImageFile = (file, maxSize = 1280, quality = 0.82) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(`${file.name} is not an image`));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Couldn't load ${file.name}`));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export const initials = (name = "") =>
  name
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
];

export const avatarColor = (name = "") => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const isTypingTarget = (el) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

const AUTH_ERRORS = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account exists for that email.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before finishing.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

export const authErrorMessage = (err) =>
  AUTH_ERRORS[err?.code] || "Something went wrong. Please try again.";
