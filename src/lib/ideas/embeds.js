import { safeUrl } from "../utils";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i;

const youtubeInfo = (u) => {
  let id = null;
  if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  else if (/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) {
    const [, first, second] = u.pathname.split("/");
    if (first === "watch") id = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(first)) id = second;
  }
  if (!id || !/^[\w-]{6,}$/.test(id)) return null;
  const t = u.searchParams.get("t") || u.searchParams.get("start");
  const start = t ? parseInt(t, 10) || 0 : 0;
  const isShort = u.pathname.startsWith("/shorts/");
  return {
    provider: "YouTube",
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0${start ? `&start=${start}` : ""}`,
    thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    aspect: isShort ? 9 / 16 : 16 / 9,
  };
};

/** Providers whose pages we can turn into an iframe embed. */
const PROVIDERS = [
  (u) => youtubeInfo(u),
  (u) => {
    const m = /(^|\.)vimeo\.com$/.test(u.hostname) && u.pathname.match(/\/(?:video\/)?(\d+)/);
    return m && { provider: "Vimeo", embedUrl: `https://player.vimeo.com/video/${m[1]}`, aspect: 16 / 9 };
  },
  (u) => {
    const m = /(^|\.)loom\.com$/.test(u.hostname) && u.pathname.match(/\/(?:share|embed)\/([\w-]+)/);
    return m && { provider: "Loom", embedUrl: `https://www.loom.com/embed/${m[1]}`, aspect: 16 / 9 };
  },
  (u) => {
    const m = u.hostname === "streamable.com" && u.pathname.match(/^\/(?:e\/)?(\w+)/);
    return m && { provider: "Streamable", embedUrl: `https://streamable.com/e/${m[1]}`, aspect: 16 / 9 };
  },
  (u) => {
    const m = /(^|\.)dailymotion\.com$/.test(u.hostname) && u.pathname.match(/\/video\/(\w+)/);
    return m && { provider: "Dailymotion", embedUrl: `https://www.dailymotion.com/embed/video/${m[1]}`, aspect: 16 / 9 };
  },
  (u) => {
    const m = u.hostname === "drive.google.com" && u.pathname.match(/\/file\/d\/([\w-]+)/);
    return m && { provider: "Google Drive", embedUrl: `https://drive.google.com/file/d/${m[1]}/preview`, aspect: 16 / 9 };
  },
  (u) => {
    const m = u.hostname === "open.spotify.com" && u.pathname.match(/^\/(?:intl-\w+\/)?(track|album|playlist|episode|show|artist)\/(\w+)/);
    return (
      m && {
        provider: "Spotify",
        embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        fixedHeight: m[1] === "track" || m[1] === "episode" ? 152 : 352,
      }
    );
  },
  (u) =>
    /(^|\.)figma\.com$/.test(u.hostname) &&
    /^\/(file|design|proto|board)\//.test(u.pathname) && {
      provider: "Figma",
      embedUrl: `https://www.figma.com/embed?embed_host=kanbanpro&url=${encodeURIComponent(u.href)}`,
      aspect: 4 / 3,
    },
  (u) => {
    const m = u.hostname === "codepen.io" && u.pathname.match(/^\/([\w-]+)\/(?:pen|full|details)\/(\w+)/);
    return m && { provider: "CodePen", embedUrl: `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`, aspect: 4 / 3 };
  },
];

/**
 * Classify a pasted URL: an embeddable page, a direct image/video file, or a
 * plain link. Returns null for anything that isn't an http(s) URL.
 */
export const analyzeUrl = (raw) => {
  const href = safeUrl(raw);
  if (!href) return null;
  const u = new URL(href);
  for (const detect of PROVIDERS) {
    const hit = detect(u);
    if (hit) return { kind: "embed", url: href, ...hit };
  }
  if (IMAGE_EXT.test(u.pathname)) return { kind: "image", url: href };
  if (VIDEO_EXT.test(u.pathname)) return { kind: "video", url: href };
  return { kind: "link", url: href, host: u.hostname.replace(/^www\./, "") };
};

/** True when a whole string is a single URL (possibly without a scheme). */
export const looksLikeUrl = (text) => {
  const t = text.trim();
  if (!t || /\s/.test(t)) return false;
  if (/^https?:\/\//i.test(t)) return true;
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t) && !!safeUrl(t);
};
