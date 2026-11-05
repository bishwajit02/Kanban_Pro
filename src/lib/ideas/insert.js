/**
 * Turn pasted/dropped content into canvas items. Every insert function takes a
 * context { folderId, canvasId, user, nextZ } and a world point `at` (the item
 * is centred on it) and resolves to the created item's { id, w, h }.
 */
import { toast } from "../toast";
import { newId } from "../utils";
import { newItemId, putItem, touchCanvas, updateItem } from "./api";
import { MAX_ASSET_BYTES, formatBytes, makeImageThumb, makeVideoThumb, prepareOriginal, uploadAsset } from "./assets";
import { analyzeUrl, looksLikeUrl } from "./embeds";

export const EMBED_HEADER = 32;
const IMAGE_MAX = 420;
const MEDIA_WIDTH = 480;

const fit = (w, h, max) => {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
};

/**
 * Not awaited: Firestore shows the local write immediately, so the item can be
 * selected/edited right away instead of after a server round-trip.
 */
const create = (ctx, at, type, w, h, data) => {
  const id = newItemId(ctx.folderId, ctx.canvasId);
  putItem(ctx.folderId, ctx.canvasId, id, {
    type,
    x: Math.round(at.x - w / 2),
    y: Math.round(at.y - h / 2),
    w,
    h,
    z: ctx.nextZ(),
    createdBy: ctx.user.uid,
    createdAt: new Date().toISOString(),
    ...data,
  }).catch((err) => {
    console.error("Couldn't add item", err);
    toast.error("Couldn't add that to the canvas. Check your connection or access.");
  });
  touchCanvas(ctx.folderId, ctx.canvasId);
  return { id, w, h };
};

/** Upload the original in the background; the thumbnail is already visible. */
const uploadInBackground = (ctx, itemId, assetId, blob, name) => {
  uploadAsset(ctx.folderId, assetId, blob, { name })
    .then(() => updateItem(ctx.folderId, ctx.canvasId, itemId, { assetReady: true }))
    .catch((err) => {
      console.error("Upload failed", err);
      toast.error(`Couldn't upload ${name}. The preview is kept, but the original is missing.`);
      updateItem(ctx.folderId, ctx.canvasId, itemId, { uploadFailed: true }).catch(() => {});
    });
};

export const insertImageFile = async (ctx, file, at) => {
  const original = await prepareOriginal(file);
  const thumb = await makeImageThumb(original);
  const [w, h] = fit(thumb.width, thumb.height, IMAGE_MAX);
  const assetId = newId();
  const created = create(ctx, at, "image", w, h, {
    thumb: thumb.dataUrl,
    assetId,
    assetReady: false,
    name: file.name || "Pasted image",
    mime: original.type,
    bytes: original.size,
    naturalWidth: thumb.width,
    naturalHeight: thumb.height,
  });
  touchCanvas(ctx.folderId, ctx.canvasId, { cover: thumb.dataUrl });
  uploadInBackground(ctx, created.id, assetId, original, file.name || "image");
  return created;
};

const insertVideoFile = async (ctx, file, at) => {
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(
      `${file.name} is ${formatBytes(file.size)}. Videos up to ${formatBytes(MAX_ASSET_BYTES)} can be uploaded — for longer ones, paste a YouTube, Vimeo or Loom link.`
    );
  }
  const thumb = await makeVideoThumb(file);
  const [w, h] = fit(thumb.width, thumb.height, MEDIA_WIDTH);
  const assetId = newId();
  const created = create(ctx, at, "video", w, h, {
    thumb: thumb.dataUrl,
    assetId,
    assetReady: false,
    name: file.name,
    mime: file.type,
    bytes: file.size,
    duration: thumb.duration || 0,
  });
  uploadInBackground(ctx, created.id, assetId, file, file.name);
  return created;
};

const insertOtherFile = async (ctx, file, at) => {
  if (file.size > MAX_ASSET_BYTES) {
    throw new Error(`${file.name} is larger than ${formatBytes(MAX_ASSET_BYTES)}.`);
  }
  const assetId = newId();
  const created = create(ctx, at, "file", 280, 76, {
    assetId,
    assetReady: false,
    name: file.name,
    mime: file.type || "application/octet-stream",
    bytes: file.size,
  });
  uploadInBackground(ctx, created.id, assetId, file, file.name);
  return created;
};

export const insertFile = (ctx, file, at) => {
  if (file.type.startsWith("image/")) return insertImageFile(ctx, file, at);
  if (file.type.startsWith("video/")) return insertVideoFile(ctx, file, at);
  return insertOtherFile(ctx, file, at);
};

const imageSize = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("timeout")), 8000);
    img.onload = () => {
      clearTimeout(timer);
      resolve([img.naturalWidth, img.naturalHeight]);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("not an image"));
    };
    img.src = src;
  });

export const insertUrl = async (ctx, raw, at) => {
  const info = analyzeUrl(raw);
  if (!info) throw new Error("That doesn't look like a valid link.");

  if (info.kind === "image") {
    try {
      const [nw, nh] = await imageSize(info.url);
      const [w, h] = fit(nw, nh, IMAGE_MAX);
      return create(ctx, at, "image", w, h, { src: info.url, name: info.url.split("/").pop() });
    } catch {
      // Fall through to a plain link card.
    }
  }

  if (info.kind === "embed" || info.kind === "video") {
    const aspect = info.aspect || 16 / 9;
    const portrait = !info.fixedHeight && aspect < 1;
    const w = portrait ? Math.round(MEDIA_WIDTH * aspect) : MEDIA_WIDTH;
    const bodyH = portrait ? MEDIA_WIDTH : info.fixedHeight || Math.round(MEDIA_WIDTH / aspect);
    return create(ctx, at, "embed", w, bodyH + EMBED_HEADER, {
      url: info.url,
      provider: info.kind === "video" ? "Video" : info.provider,
      embedUrl: info.embedUrl || null,
      videoSrc: info.kind === "video" ? info.url : null,
      thumb: info.thumb || null,
    });
  }

  return create(ctx, at, "link", 320, 84, {
    url: info.url,
    title: info.host || info.url,
  });
};

export const insertNote = (ctx, at, { kind = "note", text = "", color = "yellow" } = {}) => {
  const lines = text.split("\n").length + Math.floor(text.length / 38);
  const h = kind === "sticky" ? 220 : Math.min(420, Math.max(120, 48 + lines * 22));
  const w = kind === "sticky" ? 220 : 300;
  return create(ctx, at, kind, w, h, { text, ...(kind === "sticky" ? { color } : {}) });
};

export const insertText = async (ctx, text, at) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length && lines.length <= 10 && lines.every(looksLikeUrl)) {
    const results = [];
    let x = at.x;
    for (const line of lines) {
      const r = await insertUrl(ctx, line, { x, y: at.y });
      x += r.w + 24;
      results.push(r);
    }
    return results[0];
  }
  return insertNote(ctx, at, { text: text.trim() });
};

/** Insert several files side by side, starting at `at`. */
export const insertFiles = async (ctx, files, at) => {
  let x = at.x;
  for (const file of files) {
    try {
      const r = await insertFile(ctx, file, { x, y: at.y });
      x += r.w + 24;
    } catch (err) {
      toast.error(err.message);
    }
  }
};
