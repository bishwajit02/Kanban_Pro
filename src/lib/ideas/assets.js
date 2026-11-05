/**
 * Full-quality originals (images, videos, files) are stored in Firestore as raw
 * byte chunks so the app works without Firebase Storage. Items on the canvas
 * only carry a small thumbnail; the original is fetched on demand.
 *
 *   ideaFolders/{folderId}/assets/{assetId}            { mime, name, size, chunks }
 *   ideaFolders/{folderId}/assets/{assetId}/chunks/{i} { data: Bytes }
 */
import { Bytes, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase";

const CHUNK_BYTES = 900_000; // under Firestore's 1 MiB document limit
const CHUNKS_PER_BATCH = 8; // keeps each commit under the 10 MiB request limit
export const MAX_ASSET_BYTES = 25 * 1024 * 1024;

const assetRef = (folderId, assetId) => doc(db, "ideaFolders", folderId, "assets", assetId);
const chunkCol = (folderId, assetId) => collection(db, "ideaFolders", folderId, "assets", assetId, "chunks");

export const uploadAsset = async (folderId, assetId, blob, { name = "", onProgress } = {}) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunks = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));
  for (let start = 0; start < chunks; start += CHUNKS_PER_BATCH) {
    const batch = writeBatch(db);
    for (let i = start; i < Math.min(start + CHUNKS_PER_BATCH, chunks); i++) {
      const slice = bytes.subarray(i * CHUNK_BYTES, (i + 1) * CHUNK_BYTES);
      batch.set(doc(chunkCol(folderId, assetId), String(i)), { data: Bytes.fromUint8Array(slice) });
    }
    await batch.commit();
    onProgress?.(Math.min(1, (start + CHUNKS_PER_BATCH) / chunks));
  }
  // Written last, so an existing meta doc means the chunks are complete.
  await setDoc(assetRef(folderId, assetId), {
    mime: blob.type || "application/octet-stream",
    name,
    size: bytes.length,
    chunks,
    createdAt: serverTimestamp(),
  });
};

const cache = new Map(); // assetId -> Promise<{ url, mime, name, size }>

export const loadAsset = (folderId, assetId) => {
  if (!cache.has(assetId)) {
    const promise = (async () => {
      const meta = await getDoc(assetRef(folderId, assetId));
      if (!meta.exists()) throw new Error("This file is still uploading or was removed.");
      const { chunks, mime, name, size } = meta.data();
      const parts = await Promise.all(
        Array.from({ length: chunks }, (_, i) => getDoc(doc(chunkCol(folderId, assetId), String(i))))
      );
      const blob = new Blob(
        parts.map((p) => p.data().data.toUint8Array()),
        { type: mime }
      );
      return { url: URL.createObjectURL(blob), mime, name, size };
    })();
    promise.catch(() => cache.delete(assetId));
    cache.set(assetId, promise);
  }
  return cache.get(assetId);
};

/** Delete batches of refs, 400 at a time (Firestore allows 500 per batch). */
export const deleteRefs = async (refs) => {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
};

export const deleteAsset = async (folderId, assetId) => {
  const chunks = await getDocs(chunkCol(folderId, assetId));
  await deleteRefs([...chunks.docs.map((d) => d.ref), assetRef(folderId, assetId)]);
  const cached = cache.get(assetId);
  cache.delete(assetId);
  cached?.then(({ url }) => URL.revokeObjectURL(url)).catch(() => {});
};

// ---- Thumbnails -------------------------------------------------------------

let webpSupport;
const encode = (canvas, quality) => {
  if (webpSupport === undefined) {
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return canvas.toDataURL(webpSupport ? "image/webp" : "image/jpeg", quality);
};

/** Scale so the shorter side is `shortSide` px (e.g. 1080p -> 360p), capping the long side. */
const thumbSize = (w, h, shortSide = 360, maxLong = 1280) => {
  const scale = Math.min(1, shortSide / Math.min(w, h), maxLong / Math.max(w, h));
  return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
};

const drawToCanvas = (source, w, h, background) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
};

const loadImage = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image couldn't be read."));
    };
    img.src = url;
  });

export const makeImageThumb = async (blob) => {
  const { img, url } = await loadImage(blob);
  try {
    const width = img.naturalWidth || 800;
    const height = img.naturalHeight || 600;
    const [tw, th] = thumbSize(width, height);
    return { dataUrl: encode(drawToCanvas(img, tw, th), 0.8), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
};

/** Re-encode oversized images so the original still fits the asset limit. */
export const prepareOriginal = async (file) => {
  if (file.size <= MAX_ASSET_BYTES) return file;
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is larger than ${MAX_ASSET_BYTES / 1024 / 1024} MB.`);
  }
  const { img, url } = await loadImage(file);
  try {
    const [w, h] = thumbSize(img.naturalWidth, img.naturalHeight, 4096, 4096);
    const canvas = drawToCanvas(img, w, h, "#fff");
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (!blob || blob.size > MAX_ASSET_BYTES) throw new Error(`${file.name} is too large to upload.`);
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const makeVideoThumb = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const done = (fn) => (arg) => {
      URL.revokeObjectURL(url);
      fn(arg);
    };
    const fail = done(() => reject(new Error("That video couldn't be read in this browser.")));
    video.onerror = fail;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 0) / 2);
    };
    video.onseeked = () => {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;
      const [tw, th] = thumbSize(width, height);
      done(resolve)({
        dataUrl: encode(drawToCanvas(video, tw, th, "#000"), 0.75),
        width,
        height,
        duration: video.duration,
      });
    };
    video.src = url;
  });

export const formatBytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
};
