import React, { memo, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiExternalLink,
  FiFile,
  FiFileText,
  FiLink,
  FiMaximize2,
  FiMusic,
  FiPlay,
} from "react-icons/fi";
import { formatBytes } from "../../lib/ideas/assets";
import { analyzeUrl } from "../../lib/ideas/embeds";
import { EMBED_HEADER } from "../../lib/ideas/insert";
import { STICKY_COLORS, stickyKey } from "../../lib/ideas/stickies";
import { cn, safeUrl } from "../../lib/utils";
import Spinner from "../ui/Spinner";

/** Overlay UI that keeps a constant on-screen size regardless of zoom. */
const unscaled = (origin) => ({ transform: "scale(calc(1 / var(--z)))", transformOrigin: origin });

const stop = (e) => e.stopPropagation();

// Items saved before this change may already carry autoplay=1.
const withoutAutoplay = (url) => url.replace(/([?&])autoplay=1(&|$)/, (_, a, b) => (b ? a : "")).replace(/[?&]$/, "");
const withAutoplay = (url) => {
  const clean = withoutAutoplay(url);
  return `${clean}${clean.includes("?") ? "&" : "?"}autoplay=1`;
};

const formatDuration = (s) => {
  if (!s || !Number.isFinite(s)) return null;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const PlayButton = ({ onClick, label = "Play" }) => (
  <button
    type="button"
    aria-label={label}
    onPointerDown={stop}
    onClick={onClick}
    className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/75"
    // Constant size when zoomed in, shrinks with the content when zoomed out.
    style={{ transform: "scale(min(1, calc(1 / var(--z))))", transformOrigin: "center" }}
  >
    <FiPlay className="ml-1 h-6 w-6" />
  </button>
);

const NoteEditor = ({ initial, onCommit, className }) => {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onPointerDown={stop}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) e.currentTarget.blur();
      }}
      placeholder="Type something…"
      className={cn("h-full w-full resize-none bg-transparent outline-none placeholder:opacity-50", className)}
    />
  );
};

const fileIcon = (mime = "") => (mime.startsWith("audio/") ? FiMusic : mime.includes("pdf") || mime.startsWith("text/") ? FiFileText : FiFile);

const ItemBody = ({ item, active, editing, onOpen, onActivate, onTextCommit }) => {
  switch (item.type) {
    case "image":
      return (
        <img
          src={item.thumb || item.src}
          alt={item.name || ""}
          draggable={false}
          className="pointer-events-none h-full w-full rounded-[inherit] object-cover select-none"
        />
      );

    case "video":
      return (
        <div className="relative h-full w-full overflow-hidden rounded-[inherit] bg-black">
          {item.thumb && <img src={item.thumb} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />}
          <PlayButton onClick={() => onOpen(item)} />
          {formatDuration(item.duration) && (
            <span className="absolute right-0 bottom-0 m-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white" style={unscaled("bottom right")}>
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
      );

    case "embed": {
      // Never trust stored embedUrl/videoSrc: anyone with edit access can write
      // raw Firestore data. Re-derive them from the provider allowlist instead.
      const info = analyzeUrl(item.url);
      const embedUrl = info?.kind === "embed" ? info.embedUrl : null;
      const videoSrc = info?.kind === "video" ? info.url : null;
      const href = info?.url;
      let content;
      if (!embedUrl && !videoSrc) {
        content = <p className="flex h-full items-center justify-center p-4 text-center text-xs text-white/60">This embed link is invalid.</p>;
      } else if (active && videoSrc) content = <video src={videoSrc} controls autoPlay className="h-full w-full bg-black" />;
      else if (active && embedUrl) {
        content = (
          <iframe
            title={item.provider}
            src={withAutoplay(embedUrl)}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
            allowFullScreen
            className="h-full w-full border-0 bg-black"
          />
        );
      } else if (item.thumb || videoSrc) {
        content = (
          <>
            {item.thumb ? (
              <img src={item.thumb} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
            ) : (
              <video src={`${videoSrc}#t=0.5`} preload="metadata" muted className="pointer-events-none h-full w-full object-cover" />
            )}
            <PlayButton onClick={() => onActivate(item)} />
          </>
        );
      } else {
        // Live preview, but inert until activated so it doesn't swallow drags.
        content = (
          <>
            <iframe title={item.provider} src={withoutAutoplay(embedUrl)} loading="lazy" tabIndex={-1} allow="encrypted-media; picture-in-picture" className="pointer-events-none h-full w-full border-0 bg-white" />
            <PlayButton onClick={() => onActivate(item)} label="Interact" />
          </>
        );
      }
      return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[inherit] bg-surface-900">
          <div className="flex shrink-0 items-center gap-2 px-3 text-xs text-white/80" style={{ height: EMBED_HEADER }}>
            <span className="font-semibold text-white">{item.provider}</span>
            <span className="min-w-0 flex-1 truncate text-white/50">{href?.replace(/^https?:\/\/(www\.)?/, "")}</span>
            <a href={href} target="_blank" rel="noopener noreferrer" onPointerDown={stop} aria-label="Open original" className="rounded p-1 hover:bg-white/10">
              <FiExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="relative min-h-0 flex-1">{content}</div>
        </div>
      );
    }

    case "link": {
      const href = safeUrl(item.url);
      return (
        <div className="flex h-full w-full items-center gap-3 rounded-[inherit] border border-surface-200 bg-white px-4 dark:border-surface-700 dark:bg-surface-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
            <FiLink className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{item.title}</p>
            <a
              href={href || undefined}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={stop}
              className="block truncate text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              {href ? href.replace(/^https?:\/\//, "") : "Invalid link"}
            </a>
          </div>
        </div>
      );
    }

    case "note":
    case "sticky": {
      const sticky = item.type === "sticky";
      return (
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-[inherit] p-4",
            sticky
              ? cn("text-[15px] leading-snug font-medium", STICKY_COLORS[stickyKey(item.color)])
              : "border border-surface-200 bg-white text-sm leading-relaxed text-surface-800 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
          )}
        >
          {editing ? (
            <NoteEditor initial={item.text || ""} onCommit={(text) => onTextCommit(item, text)} />
          ) : (
            <p className={cn("h-full overflow-hidden break-words whitespace-pre-wrap", !item.text && "opacity-40")}>
              {item.text || "Double-click to write"}
            </p>
          )}
        </div>
      );
    }

    case "file": {
      const Icon = fileIcon(item.mime);
      return (
        <div className="flex h-full w-full items-center gap-3 rounded-[inherit] border border-surface-200 bg-white px-4 dark:border-surface-700 dark:bg-surface-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-200">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-50">{item.name}</p>
            <p className="text-xs text-surface-500">{formatBytes(item.bytes)}</p>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};

const OPENABLE = new Set(["image", "video", "file"]);

const CanvasItem = ({
  item,
  selected,
  editing,
  active,
  canEdit,
  onPointerDown,
  onDoubleClick,
  onResizeStart,
  onOpen,
  onActivate,
  onTextCommit,
}) => {
  const uploading = item.assetId && !item.assetReady && !item.uploadFailed;
  return (
    <div
      data-item-id={item.id}
      onPointerDown={(e) => onPointerDown(e, item)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(item);
      }}
      className={cn(
        "group absolute rounded-lg shadow-[0_1px_3px_rgb(0_0_0/0.12),0_8px_24px_-12px_rgb(0_0_0/0.25)]",
        item.type === "sticky" && "rounded-sm",
        canEdit && !editing && "cursor-grab active:cursor-grabbing"
      )}
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: item.z || 0,
        outline: selected ? "calc(2px / var(--z)) solid var(--color-primary-500)" : undefined,
        outlineOffset: selected ? "calc(2px / var(--z))" : undefined,
      }}
    >
      <ItemBody item={item} active={active} editing={editing} onOpen={onOpen} onActivate={onActivate} onTextCommit={onTextCommit} />

      {uploading && (
        <span className="absolute top-0 left-0 m-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white backdrop-blur" style={unscaled("top left")}>
          <Spinner className="h-3 w-3" /> Uploading original
        </span>
      )}
      {item.uploadFailed && (
        <span className="absolute top-0 left-0 m-2 flex items-center gap-1.5 rounded-md bg-error-600 px-2 py-1 text-[11px] text-white" style={unscaled("top left")}>
          <FiAlertTriangle className="h-3 w-3" /> Original missing
        </span>
      )}

      {OPENABLE.has(item.type) && (
        <button
          type="button"
          aria-label="Open full quality"
          title="Open full quality"
          onPointerDown={stop}
          onClick={() => onOpen(item)}
          className="absolute top-0 right-0 m-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-black/80"
          style={unscaled("top right")}
        >
          <FiMaximize2 className="h-3.5 w-3.5" />
        </button>
      )}

      {selected && canEdit && !editing && (
        <span
          role="presentation"
          onPointerDown={(e) => onResizeStart(e, item)}
          className="absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-sm border-2 border-primary-500 bg-white"
          style={unscaled("center")}
        />
      )}
    </div>
  );
};

export default memo(CanvasItem);
