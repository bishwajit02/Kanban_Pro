import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiChevronRight, FiDownload, FiExternalLink, FiFile, FiX } from "react-icons/fi";
import { formatBytes, loadAsset } from "../../lib/ideas/assets";
import { cn } from "../../lib/utils";
import Spinner from "../ui/Spinner";

/**
 * Full-screen viewer that fetches the full-quality original of an image,
 * video or file item. ← / → step through the other openable items.
 */
const AssetViewer = ({ folderId, items, index, onIndexChange, onClose }) => {
  const item = items[index];
  const [state, setState] = useState({ id: null, asset: null, error: null });
  const [actualSize, setActualSize] = useState(false);

  const itemId = item?.id;
  const src = item?.src;
  const assetId = item?.assetId;
  const available = !!item && (!!item.assetReady || !!item.uploadFailed);

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    setActualSize(false);
    if (src) {
      setState({ id: itemId, asset: { url: src, mime: "image/*" }, error: null });
    } else if (!assetId || !available) {
      setState({ id: itemId, asset: null, error: assetId ? "Still uploading — try again in a moment." : "No original available." });
    } else {
      setState({ id: itemId, asset: null, error: null });
      loadAsset(folderId, assetId)
        .then((asset) => !cancelled && setState({ id: itemId, asset, error: null }))
        .catch((err) => !cancelled && setState({ id: itemId, asset: null, error: err.message }));
    }
    return () => {
      cancelled = true;
    };
  }, [folderId, itemId, src, assetId, available]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < items.length - 1) onIndexChange(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  if (!item) return null;
  const { asset, error } = state.id === item.id ? state : { asset: null, error: null };
  const mime = asset?.mime || item.mime || "";

  let body;
  if (error) body = <p className="text-sm text-white/70">{error}</p>;
  else if (!asset) {
    body = (
      <div className="flex flex-col items-center gap-3 text-white/70">
        {item.thumb && <img src={item.thumb} alt="" className="max-h-[60vh] max-w-[80vw] opacity-40 blur-[1px]" />}
        <span className="flex items-center gap-2 text-sm">
          <Spinner className="h-4 w-4" /> Loading full quality…
        </span>
      </div>
    );
  } else if (mime.startsWith("image/")) {
    body = (
      <div className={cn("max-h-full max-w-full", actualSize && "overflow-auto")}>
        <img
          src={asset.url}
          alt={item.name || ""}
          onClick={() => setActualSize((a) => !a)}
          className={cn(
            "select-none",
            actualSize ? "max-w-none cursor-zoom-out" : "max-h-[calc(100dvh-8rem)] max-w-[92vw] cursor-zoom-in object-contain"
          )}
        />
      </div>
    );
  } else if (mime.startsWith("video/")) {
    body = <video src={asset.url} controls autoPlay className="max-h-[calc(100dvh-8rem)] max-w-[92vw] rounded-lg" />;
  } else if (mime.startsWith("audio/")) {
    body = <audio src={asset.url} controls autoPlay className="w-[min(32rem,90vw)]" />;
  } else if (mime === "application/pdf") {
    body = <iframe title={item.name} src={asset.url} className="h-[calc(100dvh-8rem)] w-[min(60rem,92vw)] rounded-lg bg-white" />;
  } else {
    body = (
      <div className="flex flex-col items-center gap-3 text-white">
        <FiFile className="h-10 w-10 text-white/60" />
        <p className="text-sm">{item.name}</p>
        <a href={asset.url} download={item.name} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-surface-900">
          Download ({formatBytes(asset.size)})
        </a>
      </div>
    );
  }

  const navButton = "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex h-14 shrink-0 items-center gap-3 px-4 text-white">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name || "Untitled"}</p>
          <p className="text-xs text-white/50">
            {[item.naturalWidth && `${item.naturalWidth} × ${item.naturalHeight}`, item.bytes && formatBytes(item.bytes), items.length > 1 && `${index + 1} of ${items.length}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {asset && (
          <>
            <a href={asset.url} target="_blank" rel="noreferrer" className="rounded-md p-2 hover:bg-white/10" aria-label="Open in new tab">
              <FiExternalLink className="h-4 w-4" />
            </a>
            <a href={asset.url} download={item.name || "download"} className="rounded-md p-2 hover:bg-white/10" aria-label="Download original">
              <FiDownload className="h-4 w-4" />
            </a>
          </>
        )}
        <button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-white/10" aria-label="Close">
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {index > 0 && (
          <button type="button" aria-label="Previous" onClick={() => onIndexChange(index - 1)} className={cn(navButton, "left-4")}>
            <FiChevronLeft className="h-5 w-5" />
          </button>
        )}
        {body}
        {index < items.length - 1 && (
          <button type="button" aria-label="Next" onClick={() => onIndexChange(index + 1)} className={cn(navButton, "right-4")}>
            <FiChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AssetViewer;
