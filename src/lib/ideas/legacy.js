/** One-time import of ideas saved in this browser by the previous local-only version. */
import { createFolder, normalizeFolderName } from "./api";
import { insertImageFile, insertNote, insertUrl } from "./insert";
import { stickyKey } from "./stickies";

const keysFor = (uid) => [`idea_folders:${uid}`, "idea_folders"];

export const readLegacyIdeas = (uid) => {
  for (const key of keysFor(uid)) {
    try {
      const folders = JSON.parse(localStorage.getItem(key) || "null");
      if (!Array.isArray(folders)) continue;
      const count = folders.reduce((n, f) => n + (f.items?.length || 0), 0);
      if (count) return { folders, count };
    } catch {
      // ignore unreadable data
    }
  }
  return null;
};

export const clearLegacyIdeas = (uid) => {
  keysFor(uid).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });
};

const uniqueName = (base, taken) => {
  const clean = normalizeFolderName(base.replace(/\//g, "-")).slice(0, 48) || "Imported";
  let name = clean;
  for (let n = 1; taken.has(name.toLowerCase()); n++) name = `${clean} (imported${n > 1 ? ` ${n}` : ""})`;
  taken.add(name.toLowerCase());
  return name;
};

export const importLegacyIdeas = async (user, folders, ownedFolders, onProgress) => {
  const taken = new Set(ownedFolders.map((f) => f.nameLower));
  const total = folders.reduce((n, f) => n + (f.items?.length || 0), 0);
  let done = 0;
  let failed = 0;

  for (const folder of folders) {
    if (!folder.items?.length) continue;
    const { folderId, canvasId } = await createFolder(user, uniqueName(folder.name || "Imported", taken));
    let z = 1;
    const ctx = { folderId, canvasId, user, nextZ: () => z++ };

    // Oldest first, on a 3-column grid with cells wider than the largest item (480px embeds).
    const items = [...folder.items].reverse();
    for (const [i, item] of items.entries()) {
      const at = { x: (i % 3) * 540, y: Math.floor(i / 3) * 500 };
      try {
        if (item.type === "sticky") await insertNote(ctx, at, { kind: "sticky", text: item.content || "", color: stickyKey(item.color) });
        else if (item.type === "text") await insertNote(ctx, at, { text: item.content || "" });
        else if (item.type === "link") await insertUrl(ctx, item.content, at);
        else if (item.type === "image" && item.content?.startsWith("data:")) {
          const blob = await (await fetch(item.content)).blob();
          await insertImageFile(ctx, new File([blob], item.name || "image.jpg", { type: blob.type }), at);
        }
      } catch (err) {
        console.error("Couldn't import idea", item, err);
        failed++;
      }
      onProgress?.(++done / total);
    }
  }
  clearLegacyIdeas(user.uid);
  return { imported: total - failed, failed };
};
