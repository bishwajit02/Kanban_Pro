import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { deleteAsset, deleteRefs } from "./assets";

// ---- Roles ------------------------------------------------------------------

export const ROLES = {
  viewer: { label: "Visitor", description: "Can view canvases" },
  commenter: { label: "Commenter", description: "Can view and comment" },
  editor: { label: "Editor", description: "Can add, move and delete anything" },
};

export const roleFor = (folder, user) => {
  if (!folder || !user) return null;
  if (folder.ownerId === user.uid) return "owner";
  return folder.members?.[user.email?.toLowerCase()] || null;
};

export const can = {
  edit: (role) => role === "owner" || role === "editor",
  comment: (role) => role === "owner" || role === "editor" || role === "commenter",
  manage: (role) => role === "owner",
};

// ---- Folders ------------------------------------------------------------------

export const MAX_FOLDER_NAME = 60;

export const normalizeFolderName = (name) => name.replace(/\s+/g, " ").trim();

/** Returns an error message, or null when the name is acceptable. */
export const validateFolderName = (name, ownedFolders, exceptId) => {
  const clean = normalizeFolderName(name);
  if (!clean) return "Give the folder a name.";
  if (clean.length > MAX_FOLDER_NAME) return `Keep it under ${MAX_FOLDER_NAME} characters.`;
  if (clean.includes("/")) return "Folder names can't contain “/”.";
  const taken = ownedFolders.some((f) => f.id !== exceptId && f.nameLower === clean.toLowerCase());
  return taken ? `You already have a folder called “${clean}”.` : null;
};

const folderRef = (folderId) => doc(db, "ideaFolders", folderId);
const nameLockRef = (ownerId, nameLower) => doc(db, "ideaFolderNames", `${ownerId}_${nameLower}`);

const describeWriteError = (err, name) =>
  err?.code === "permission-denied"
    ? new Error(`You already have a folder called “${name}”.`)
    : err;

export const createFolder = async (user, rawName) => {
  const name = normalizeFolderName(rawName);
  const ref = doc(collection(db, "ideaFolders"));
  const batch = writeBatch(db);
  batch.set(ref, {
    name,
    nameLower: name.toLowerCase(),
    ownerId: user.uid,
    ownerEmail: user.email?.toLowerCase() || "",
    ownerName: user.displayName || user.email || "",
    members: {},
    memberEmails: [],
    createdAt: serverTimestamp(),
  });
  batch.set(nameLockRef(user.uid, name.toLowerCase()), {
    ownerId: user.uid,
    folderId: ref.id,
    nameLower: name.toLowerCase(),
  });
  try {
    await batch.commit();
  } catch (err) {
    throw describeWriteError(err, name);
  }
  const canvasId = await createCanvas(ref.id, "Canvas 1", user);
  return { folderId: ref.id, canvasId };
};

export const renameFolder = async (folder, rawName) => {
  const name = normalizeFolderName(rawName);
  const nameLower = name.toLowerCase();
  const batch = writeBatch(db);
  batch.update(folderRef(folder.id), { name, nameLower });
  if (nameLower !== folder.nameLower) {
    batch.set(nameLockRef(folder.ownerId, nameLower), { ownerId: folder.ownerId, folderId: folder.id, nameLower });
    batch.delete(nameLockRef(folder.ownerId, folder.nameLower));
  }
  try {
    await batch.commit();
  } catch (err) {
    throw describeWriteError(err, name);
  }
};

export const setFolderMembers = (folderId, members) =>
  updateDoc(folderRef(folderId), { members, memberEmails: Object.keys(members) });

export const deleteFolder = async (folder) => {
  const canvases = await getDocs(collection(db, "ideaFolders", folder.id, "canvases"));
  for (const c of canvases.docs) await deleteCanvasContents(folder.id, c.id);
  const assets = await getDocs(collection(db, "ideaFolders", folder.id, "assets"));
  for (const a of assets.docs) await deleteAsset(folder.id, a.id);
  await deleteRefs(canvases.docs.map((d) => d.ref));
  const batch = writeBatch(db);
  batch.delete(folderRef(folder.id));
  batch.delete(nameLockRef(folder.ownerId, folder.nameLower));
  await batch.commit();
};

// ---- Canvases -----------------------------------------------------------------

const canvasRef = (folderId, canvasId) => doc(db, "ideaFolders", folderId, "canvases", canvasId);

export const createCanvas = async (folderId, name, user) => {
  const ref = doc(collection(db, "ideaFolders", folderId, "canvases"));
  await setDoc(ref, {
    name: name.trim().slice(0, 80) || "Untitled canvas",
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const renameCanvas = (folderId, canvasId, name) =>
  updateDoc(canvasRef(folderId, canvasId), { name: name.trim().slice(0, 80) });

const touchTimes = new Map();
/** Bump a canvas's "updated" time (throttled) and optionally its cover image. */
export const touchCanvas = (folderId, canvasId, extra = {}) => {
  const last = touchTimes.get(canvasId) || 0;
  if (!extra.cover && Date.now() - last < 30_000) return;
  touchTimes.set(canvasId, Date.now());
  updateDoc(canvasRef(folderId, canvasId), { updatedAt: serverTimestamp(), ...extra }).catch(() => {});
};

const deleteCanvasContents = async (folderId, canvasId) => {
  const [items, comments] = await Promise.all([
    getDocs(collection(canvasRef(folderId, canvasId), "items")),
    getDocs(collection(canvasRef(folderId, canvasId), "comments")),
  ]);
  const assetIds = new Set(items.docs.map((d) => d.data().assetId).filter(Boolean));
  for (const id of assetIds) await deleteAsset(folderId, id);
  await deleteRefs([...items.docs, ...comments.docs].map((d) => d.ref));
};

export const deleteCanvas = async (folderId, canvasId) => {
  await deleteCanvasContents(folderId, canvasId);
  await deleteDoc(canvasRef(folderId, canvasId));
};

// ---- Items ----------------------------------------------------------------------

const itemsCol = (folderId, canvasId) => collection(canvasRef(folderId, canvasId), "items");

export const newItemId = (folderId, canvasId) => doc(itemsCol(folderId, canvasId)).id;

export const putItem = (folderId, canvasId, id, data) =>
  setDoc(doc(itemsCol(folderId, canvasId), id), { ...data, updatedAt: serverTimestamp() });

export const updateItem = (folderId, canvasId, id, patch) =>
  updateDoc(doc(itemsCol(folderId, canvasId), id), { ...patch, updatedAt: serverTimestamp() });

/** patches: [{ id, ...fields }] */
export const updateItems = async (folderId, canvasId, patches) => {
  const batch = writeBatch(db);
  patches.forEach(({ id, ...patch }) =>
    batch.update(doc(itemsCol(folderId, canvasId), id), { ...patch, updatedAt: serverTimestamp() })
  );
  await batch.commit();
};

export const deleteItems = (folderId, canvasId, ids) =>
  deleteRefs(ids.map((id) => doc(itemsCol(folderId, canvasId), id)));

export const restoreItems = async (folderId, canvasId, items) => {
  const batch = writeBatch(db);
  items.forEach(({ id, ...data }) => batch.set(doc(itemsCol(folderId, canvasId), id), data));
  await batch.commit();
};

// ---- Comments -------------------------------------------------------------------

const commentsCol = (folderId, canvasId) => collection(canvasRef(folderId, canvasId), "comments");

const author = (user) => ({
  authorUid: user.uid,
  authorName: user.displayName || user.email,
  authorEmail: user.email?.toLowerCase() || "",
});

export const addComment = async (folderId, canvasId, user, { x, y, text }) => {
  const ref = doc(commentsCol(folderId, canvasId));
  await setDoc(ref, { x, y, text, ...author(user), createdAt: serverTimestamp(), resolved: false, replies: [] });
  return ref.id;
};

export const replyToComment = (folderId, canvasId, commentId, user, text) =>
  updateDoc(doc(commentsCol(folderId, canvasId), commentId), {
    // Client timestamp: serverTimestamp() isn't allowed inside arrays.
    replies: arrayUnion({ ...author(user), text, createdAt: new Date().toISOString() }),
  });

export const setCommentResolved = (folderId, canvasId, commentId, user, resolved) =>
  updateDoc(doc(commentsCol(folderId, canvasId), commentId), {
    resolved,
    resolvedBy: resolved ? user.displayName || user.email : null,
  });

export const deleteComment = (folderId, canvasId, commentId) => deleteDoc(doc(commentsCol(folderId, canvasId), commentId));
