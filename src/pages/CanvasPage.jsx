import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiEdit2,
  FiFileText,
  FiHelpCircle,
  FiLink,
  FiMaximize,
  FiMaximize2,
  FiMessageCircle,
  FiMinus,
  FiMousePointer,
  FiMove,
  FiPlus,
  FiShare2,
  FiTrash2,
  FiUpload,
  FiLock,
} from "react-icons/fi";
import { MdOutlineStickyNote2 } from "react-icons/md";
import {
  ROLES,
  addComment,
  can,
  createCanvas,
  deleteCanvas,
  deleteComment,
  deleteItems,
  newItemId,
  renameCanvas,
  replyToComment,
  restoreItems,
  roleFor,
  setCommentResolved,
  touchCanvas,
  updateItem,
  updateItems,
} from "../lib/ideas/api";
import { deleteAsset } from "../lib/ideas/assets";
import { analyzeUrl } from "../lib/ideas/embeds";
import { useCanvasItems, useCanvases, useComments, useFolder } from "../lib/ideas/hooks";
import { EMBED_HEADER, insertFiles, insertNote, insertText, insertUrl } from "../lib/ideas/insert";
import { STICKY_SWATCHES } from "../lib/ideas/stickies";
import { toast } from "../lib/toast";
import { cn, isTypingTarget, safeUrl } from "../lib/utils";
import AssetViewer from "../components/ideas/AssetViewer";
import CanvasItem from "../components/ideas/CanvasItem";
import CommentLayer from "../components/ideas/CommentLayer";
import ShareModal from "../components/ideas/ShareModal";
import { AvatarStack } from "../components/ui/Avatar";
import { ConfirmDialog, PromptDialog } from "../components/ui/Dialogs";
import Menu, { MenuItem, MenuSeparator } from "../components/ui/Menu";
import Spinner from "../components/ui/Spinner";

const MIN_Z = 0.05;
const MAX_Z = 8;
const EMPTY = [];
const OPENABLE = new Set(["image", "video", "file"]);
const KEEP_ASPECT = new Set(["image", "video", "embed"]);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Stable callback that always sees the latest props/state. */
const useEvent = (fn) => {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args) => ref.current(...args), []);
};

const camKey = (canvasId) => `kp-cam:${canvasId}`;
const readCam = (canvasId) => {
  try {
    const c = JSON.parse(localStorage.getItem(camKey(canvasId)));
    return c && Number.isFinite(c.x) && Number.isFinite(c.z) ? c : null;
  } catch {
    return null;
  }
};

const shortcuts = [
  ["Paste / drop", "Add images, videos, links, text"],
  ["Drag background", "Pan"],
  ["Scroll · Pinch", "Zoom"],
  ["Shift + drag", "Select area"],
  ["Double-click", "Open, play or edit"],
  ["V · H · C", "Select · Hand · Comment"],
  ["N · S · L · U", "Note · Sticky · Link · Upload"],
  ["F", "Zoom to fit"],
  ["Ctrl + D", "Duplicate"],
  ["Delete", "Remove selection"],
];

const ToolButton = ({ active, label, shortcut, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
    aria-label={label}
    className={cn(
      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
      active
        ? "bg-primary-600 text-white shadow-sm dark:bg-primary-500"
        : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white"
    )}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const panel =
  "pointer-events-auto rounded-xl border border-surface-200 bg-white/95 shadow-pop backdrop-blur dark:border-surface-800 dark:bg-surface-900/95";

const CanvasPage = ({ user }) => {
  const { folderId, canvasId } = useParams();
  const navigate = useNavigate();
  const folderQ = useFolder(folderId);
  const canvasesQ = useCanvases(folderId);
  const itemsQ = useCanvasItems(folderId, canvasId);
  const commentsQ = useComments(folderId, canvasId);

  const folder = folderQ.data;
  const role = roleFor(folder, user);
  const canEdit = can.edit(role);
  const canComment = can.comment(role);
  const canvases = canvasesQ.data || EMPTY;
  const canvas = canvases.find((c) => c.id === canvasId);
  const items = itemsQ.data || EMPTY;
  const comments = commentsQ.data || EMPTY;

  const [tool, setTool] = useState("select");
  const [selection, setSelection] = useState([]);
  const [drag, setDrag] = useState(null); // { ids:Set, dx, dy }
  const [overrides, setOverrides] = useState({}); // optimistic geometry until Firestore echoes it
  const [editingId, setEditingId] = useState(null);
  const [activeId, setActiveId] = useState(null); // embed currently playing / interactive
  const [marquee, setMarquee] = useState(null);
  const [openCommentId, setOpenCommentId] = useState(null);
  const [draftComment, setDraftComment] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [viewer, setViewer] = useState(null); // { ids, index }
  const [dialog, setDialog] = useState(null); // share | link | newCanvas | renameCanvas | deleteCanvas
  const [zoomPct, setZoomPct] = useState(100);
  const [panning, setPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [dropHint, setDropHint] = useState(false);

  const viewportRef = useRef(null);
  const worldRef = useRef(null);
  const fileInputRef = useRef(null);
  const cam = useRef(readCam(canvasId) || { x: 0, y: 0, z: 1 });
  const camReady = useRef(!!readCam(canvasId));
  const gesture = useRef(null);
  const pointers = useRef(new Map());
  const lastPointer = useRef(null);
  const zCounter = useRef(0);
  const saveTimer = useRef(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const maxZ = useMemo(() => items.reduce((m, i) => Math.max(m, i.z || 0), 0), [items]);
  const nextZ = useEvent(() => (zCounter.current = Math.max(zCounter.current, maxZ) + 1));
  const ctx = useMemo(() => ({ folderId, canvasId, user, nextZ }), [folderId, canvasId, user, nextZ]);
  const modalOpen = !!dialog || !!viewer;

  // ---- Camera ------------------------------------------------------------------

  const applyCam = useCallback(() => {
    const vp = viewportRef.current;
    const world = worldRef.current;
    if (!vp || !world) return;
    const { x, y, z } = cam.current;
    world.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
    vp.style.setProperty("--z", z);
    let grid = 24 * z;
    while (grid < 12) grid *= 4;
    vp.style.backgroundSize = `${grid}px ${grid}px`;
    vp.style.backgroundPosition = `${x}px ${y}px`;
    setZoomPct(Math.round(z * 100));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(camKey(canvasId), JSON.stringify(cam.current));
      } catch {
        // ignore
      }
    }, 400);
  }, [canvasId]);

  const toWorld = useCallback((clientX, clientY) => {
    const rect = viewportRef.current.getBoundingClientRect();
    const { x, y, z } = cam.current;
    return { x: (clientX - rect.left - x) / z, y: (clientY - rect.top - y) / z };
  }, []);

  const viewCenter = useCallback(() => {
    const rect = viewportRef.current.getBoundingClientRect();
    return toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [toWorld]);

  /** Where pasted content lands: under the cursor if it's over the canvas. */
  const insertionPoint = () => {
    const rect = viewportRef.current.getBoundingClientRect();
    const p = lastPointer.current;
    if (p && p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom) return toWorld(p.x, p.y);
    return viewCenter();
  };

  const zoomAt = useCallback(
    (sx, sy, factor) => {
      const c = cam.current;
      const z = clamp(c.z * factor, MIN_Z, MAX_Z);
      cam.current = { x: sx - ((sx - c.x) * z) / c.z, y: sy - ((sy - c.y) * z) / c.z, z };
      applyCam();
    },
    [applyCam]
  );

  const zoomBy = (factor) => {
    const rect = viewportRef.current.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, factor);
  };

  const fitTo = useCallback(
    (list) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (!list.length) {
        cam.current = { x: rect.width / 2, y: rect.height / 2, z: 1 };
      } else {
        const minX = Math.min(...list.map((i) => i.x));
        const minY = Math.min(...list.map((i) => i.y));
        const maxX = Math.max(...list.map((i) => i.x + i.w));
        const maxY = Math.max(...list.map((i) => i.y + i.h));
        const z = clamp(Math.min((rect.width - 120) / (maxX - minX), (rect.height - 180) / (maxY - minY)), MIN_Z, 1.5);
        cam.current = {
          x: rect.width / 2 - ((minX + maxX) / 2) * z,
          y: rect.height / 2 - ((minY + maxY) / 2) * z + 10,
          z,
        };
      }
      applyCam();
    },
    [applyCam]
  );

  // First paint: restore the saved camera, or frame the content once it loads.
  useLayoutEffect(() => {
    if (camReady.current) return applyCam();
    if (itemsQ.data) {
      camReady.current = true;
      fitTo(itemsQ.data);
    } else applyCam();
  }, [itemsQ.data, applyCam, fitTo]);

  useEffect(() => {
    const vp = viewportRef.current;
    const onWheel = (e) => {
      if (e.target.closest?.("[data-no-wheel], textarea")) return;
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : 1;
      if (e.shiftKey || (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY))) {
        cam.current.x -= (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit;
        cam.current.y -= e.shiftKey ? 0 : e.deltaY * unit;
        applyCam();
        return;
      }
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [applyCam, zoomAt]);

  // ---- Persisting geometry --------------------------------------------------------

  const commitGeometry = useEvent((patches) => {
    if (!patches.length) return;
    setOverrides((o) => {
      const next = { ...o };
      patches.forEach(({ id, ...p }) => (next[id] = { ...next[id], ...p }));
      return next;
    });
    updateItems(folderId, canvasId, patches).catch((err) => {
      console.error(err);
      toast.error("Couldn't save that change.");
      setOverrides((o) => {
        const next = { ...o };
        patches.forEach(({ id }) => delete next[id]);
        return next;
      });
    });
    touchCanvas(folderId, canvasId);
  });

  // Drop optimistic overrides once Firestore reflects them.
  useEffect(() => {
    setOverrides((o) => {
      let changed = false;
      const next = { ...o };
      for (const [id, ov] of Object.entries(o)) {
        const it = byId.get(id);
        if (gesture.current?.type === "resize" && gesture.current.id === id) continue;
        if (!it || Object.keys(ov).every((k) => it[k] === ov[k])) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : o;
    });
  }, [byId]);

  const displayItems = useMemo(
    () =>
      items.map((it) => {
        const ov = overrides[it.id];
        const moving = drag?.ids.has(it.id);
        if (!ov && !moving) return it;
        const merged = { ...it, ...ov };
        if (moving) {
          merged.x += drag.dx;
          merged.y += drag.dy;
        }
        return merged;
      }),
    [items, overrides, drag]
  );

  // ---- Gestures (pan, move, resize, marquee, pinch) ----------------------------------

  const startGesture = (e, g) => {
    gesture.current = {
      ...g,
      pointerId: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      cx: cam.current.x,
      cy: cam.current.y,
      moved: false,
    };
    if (g.type === "pan") setPanning(true);
  };

  const resizeTo = (g, e) => {
    const z = cam.current.z;
    const w = Math.max(48, g.w + (e.clientX - g.sx) / z);
    const keep = g.keep !== e.shiftKey;
    const h = keep ? w / g.ratio + g.header : Math.max(40, g.h + (e.clientY - g.sy) / z);
    return { w: Math.round(w), h: Math.round(h) };
  };

  const onGestureMove = useEvent((e) => {
    const g = gesture.current;
    if (g.type === "pinch") {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const mid = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
      const z = clamp((g.z * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, MIN_Z, MAX_Z);
      const wx = (g.mid.x - g.cx) / g.z;
      const wy = (g.mid.y - g.cy) / g.z;
      cam.current = { x: mid.x - wx * z, y: mid.y - wy * z, z };
      applyCam();
      return;
    }
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    const z = cam.current.z;
    if (g.type === "pan") {
      cam.current.x = g.cx + dx;
      cam.current.y = g.cy + dy;
      applyCam();
    } else if (g.type === "move") {
      setDrag({ ids: g.idSet, dx: dx / z, dy: dy / z });
    } else if (g.type === "resize") {
      const size = resizeTo(g, e);
      setOverrides((o) => ({ ...o, [g.id]: { ...o[g.id], ...size } }));
    } else if (g.type === "marquee") {
      setMarquee({ x1: g.sx, y1: g.sy, x2: e.clientX, y2: e.clientY });
      const a = toWorld(g.sx, g.sy);
      const b = toWorld(e.clientX, e.clientY);
      const [x1, x2, y1, y2] = [Math.min(a.x, b.x), Math.max(a.x, b.x), Math.min(a.y, b.y), Math.max(a.y, b.y)];
      const hits = displayItems.filter((i) => i.x < x2 && i.x + i.w > x1 && i.y < y2 && i.y + i.h > y1).map((i) => i.id);
      setSelection([...new Set([...g.base, ...hits])]);
    }
  });

  const onGestureEnd = useEvent((e, g) => {
    setPanning(false);
    const z = cam.current.z;
    if (g.type === "pan" && !g.moved && g.clickItem) openItem(g.clickItem);
    if (g.type === "move") {
      if (g.moved) {
        const dx = (e.clientX - g.sx) / z;
        const dy = (e.clientY - g.sy) / z;
        commitGeometry(
          [...g.idSet]
            .map((id) => byId.get(id))
            .filter(Boolean)
            .map((it) => ({ id: it.id, x: Math.round(it.x + dx), y: Math.round(it.y + dy), z: nextZ() }))
        );
      } else if (g.collapseTo) setSelection([g.collapseTo]);
      setDrag(null);
    }
    if (g.type === "resize" && g.moved) commitGeometry([{ id: g.id, ...resizeTo(g, e) }]);
    if (g.type === "marquee") setMarquee(null);
  });

  useEffect(() => {
    const onMove = (e) => {
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastPointer.current = { x: e.clientX, y: e.clientY };
      if (gesture.current) onGestureMove(e);
    };
    const onUp = (e) => {
      pointers.current.delete(e.pointerId);
      const g = gesture.current;
      if (!g) return;
      if (g.type === "pinch") {
        if (pointers.current.size < 2) {
          gesture.current = null;
          setPanning(false);
        }
        return;
      }
      if (e.pointerId !== g.pointerId) return;
      gesture.current = null;
      onGestureEnd(e, g);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onGestureMove, onGestureEnd]);

  const onViewportPointerDownCapture = (e) => {
    if (e.pointerType !== "touch") return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      e.stopPropagation();
      const [a, b] = [...pointers.current.values()];
      const rect = viewportRef.current.getBoundingClientRect();
      setDrag(null);
      gesture.current = {
        type: "pinch",
        dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        z: cam.current.z,
        cx: cam.current.x,
        cy: cam.current.y,
        mid: { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top },
      };
    }
  };

  const onViewportPointerDown = (e) => {
    if (e.button === 2) return;
    const panOnly = e.button === 1 || tool === "hand" || spaceHeld;
    setOpenCommentId(null);
    setActiveId(null);
    // preventDefault below stops the browser from moving focus, so commit edits explicitly.
    if (isTypingTarget(document.activeElement)) document.activeElement.blur();
    // Stop the browser's default focus change; it would steal focus from the
    // comment composer / note editor that this click is about to open.
    e.preventDefault();
    if (!panOnly && e.button === 0) {
      const at = toWorld(e.clientX, e.clientY);
      if (tool === "comment") {
        if (canComment) setDraftComment(at);
        setTool("select");
        return;
      }
      if ((tool === "note" || tool === "sticky") && canEdit) {
        createNote(tool, at);
        setTool("select");
        return;
      }
      if (e.shiftKey && canEdit) {
        startGesture(e, { type: "marquee", base: selection });
        return;
      }
      setSelection([]);
      setDraftComment(null);
    }
    startGesture(e, { type: "pan" });
  };

  const onItemPointerDown = useEvent((e, item) => {
    const panOnly = e.button === 1 || tool === "hand" || spaceHeld;
    if (panOnly || tool === "comment" || e.button === 2) return; // let the viewport handle it
    e.stopPropagation();
    if (editingId === item.id) return;
    setOpenCommentId(null);
    if (activeId && activeId !== item.id) setActiveId(null);
    if (!canEdit) {
      startGesture(e, { type: "pan", clickItem: OPENABLE.has(item.type) ? item : null });
      return;
    }
    let ids;
    let collapseTo = null;
    if (e.shiftKey) {
      ids = selection.includes(item.id) ? selection.filter((i) => i !== item.id) : [...selection, item.id];
      setSelection(ids);
      if (!ids.includes(item.id)) return;
    } else if (selection.includes(item.id)) {
      ids = selection;
      collapseTo = selection.length > 1 ? item.id : null;
    } else {
      ids = [item.id];
      setSelection(ids);
    }
    startGesture(e, { type: "move", idSet: new Set(ids), collapseTo });
  });

  const onResizeStart = useEvent((e, item) => {
    e.stopPropagation();
    const header = item.type === "embed" ? EMBED_HEADER : 0;
    startGesture(e, {
      type: "resize",
      id: item.id,
      w: item.w,
      h: item.h,
      header,
      ratio: item.w / Math.max(1, item.h - header),
      keep: KEEP_ASPECT.has(item.type),
    });
  });

  // ---- Item actions ---------------------------------------------------------------------

  const openables = useMemo(
    () => displayItems.filter((i) => OPENABLE.has(i.type)).sort((a, b) => a.y - b.y || a.x - b.x),
    [displayItems]
  );

  const openItem = useEvent((item) => {
    if (OPENABLE.has(item.type)) {
      const ids = openables.map((i) => i.id);
      setViewer({ ids, index: Math.max(0, ids.indexOf(item.id)) });
    } else if (item.type === "embed") setActiveId(item.id);
    else if (item.type === "link" && safeUrl(item.url)) window.open(safeUrl(item.url), "_blank", "noopener");
  });

  const onItemDoubleClick = useEvent((item) => {
    if ((item.type === "note" || item.type === "sticky") && canEdit) {
      setSelection([item.id]);
      setEditingId(item.id);
    } else openItem(item);
  });

  const onActivate = useEvent((item) => setActiveId(item.id));

  const onTextCommit = useEvent((item, text) => {
    setEditingId(null);
    if (text !== (item.text || "")) {
      updateItem(folderId, canvasId, item.id, { text }).catch(() => toast.error("Couldn't save the note."));
      touchCanvas(folderId, canvasId);
    }
  });

  const createNote = async (kind, at) => {
    try {
      const { id } = await insertNote(ctx, at, { kind });
      setSelection([id]);
      setEditingId(id);
    } catch {
      toast.error("Couldn't add a note.");
    }
  };

  const removeItems = (ids) => {
    const removed = items.filter((i) => ids.includes(i.id));
    if (!removed.length) return;
    setSelection([]);
    setEditingId(null);
    const remaining = items.filter((i) => !ids.includes(i.id));
    const orphans = [...new Set(removed.map((i) => i.assetId).filter(Boolean))].filter(
      (a) => !remaining.some((i) => i.assetId === a)
    );
    deleteItems(folderId, canvasId, ids).catch(() => toast.error("Couldn't delete those items."));
    let undone = false;
    // Originals are only purged once the undo window has passed.
    const timer = setTimeout(() => {
      if (!undone) orphans.forEach((a) => deleteAsset(folderId, a).catch(() => {}));
    }, 9000);
    toast(removed.length === 1 ? "Item deleted" : `${removed.length} items deleted`, {
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          restoreItems(folderId, canvasId, removed).catch(() => toast.error("Couldn't restore."));
        },
      },
    });
    touchCanvas(folderId, canvasId);
  };

  const duplicate = (ids) => {
    const source = items.filter((i) => ids.includes(i.id) && !(i.assetId && !i.assetReady));
    if (!source.length) return;
    const copies = source.map((it) => ({
      ...it,
      id: newItemId(folderId, canvasId),
      x: it.x + 32,
      y: it.y + 32,
      z: nextZ(),
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
    }));
    restoreItems(folderId, canvasId, copies).catch(() => toast.error("Couldn't duplicate."));
    setSelection(copies.map((c) => c.id));
  };

  const restack = (ids, front) => {
    const minZ = items.reduce((m, i) => Math.min(m, i.z || 0), 0);
    commitGeometry(ids.map((id, n) => ({ id, z: front ? nextZ() : minZ - ids.length + n })));
  };

  // ---- Paste, drop, upload ---------------------------------------------------------------

  const insertFromTransfer = async (dt, at) => {
    const files = [...(dt.files || [])];
    if (files.length) return insertFiles(ctx, files, at);
    const text = dt.getData("text/plain") || dt.getData("text/uri-list").split("\n").find((l) => l && !l.startsWith("#")) || "";
    const html = dt.getData("text/html");
    try {
      if (text.trim()) await insertText(ctx, text, at);
      else if (html) {
        const src = new DOMParser().parseFromString(html, "text/html").querySelector("img")?.src;
        if (src) await insertUrl(ctx, src, at);
      }
    } catch (err) {
      toast.error(err.message || "Couldn't add that.");
    }
  };

  useEffect(() => {
    const onPaste = (e) => {
      if (isTypingTarget(e.target) || modalOpen || !itemsQ.data) return;
      if (!canEdit) {
        toast("You have view-only access to this folder.");
        return;
      }
      e.preventDefault();
      insertFromTransfer(e.clipboardData, insertionPoint());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const onDrop = (e) => {
    e.preventDefault();
    setDropHint(false);
    if (canEdit) insertFromTransfer(e.dataTransfer, toWorld(e.clientX, e.clientY));
  };

  // ---- Keyboard -----------------------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(e.target) || modalOpen) return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod) {
        if (key === "a" && canEdit) {
          e.preventDefault();
          setSelection(items.map((i) => i.id));
        } else if (key === "d" && canEdit && selection.length) {
          e.preventDefault();
          duplicate(selection);
        } else if (key === "=" || key === "+") {
          e.preventDefault();
          zoomBy(1.25);
        } else if (key === "-") {
          e.preventDefault();
          zoomBy(0.8);
        } else if (key === "0") {
          e.preventDefault();
          zoomBy(1 / cam.current.z);
        }
        return;
      }
      if (e.altKey) return;
      const actions = {
        v: () => setTool("select"),
        h: () => setTool("hand"),
        c: () => canComment && setTool("comment"),
        n: () => canEdit && setTool("note"),
        s: () => canEdit && setTool("sticky"),
        l: () => canEdit && setDialog("link"),
        u: () => canEdit && fileInputRef.current?.click(),
        f: () => fitTo(selection.length ? displayItems.filter((i) => selection.includes(i.id)) : displayItems),
        "+": () => zoomBy(1.25),
        "=": () => zoomBy(1.25),
        "-": () => zoomBy(0.8),
        delete: () => canEdit && removeItems(selection),
        backspace: () => canEdit && removeItems(selection),
        enter: () => selection.length === 1 && byId.get(selection[0]) && onItemDoubleClick(byId.get(selection[0])),
        escape: () => {
          setSelection([]);
          setTool("select");
          setActiveId(null);
          setDraftComment(null);
          setOpenCommentId(null);
        },
      };
      if (actions[key]) {
        e.preventDefault();
        actions[key]();
      }
    };
    const onKeyUp = (e) => e.code === "Space" && setSpaceHeld(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // ---- Render ---------------------------------------------------------------------------------

  const blocked = folderQ.error || folder === null || (canvasesQ.data && !canvas);
  const selectedItems = selection.map((id) => byId.get(id)).filter(Boolean);
  const unresolved = comments.filter((c) => !c.resolved).length;
  const cursor = panning ? "grabbing" : tool === "hand" || spaceHeld ? "grab" : tool === "select" ? "default" : "crosshair";

  const commentHandlers = {
    onCreate: (c) => addComment(folderId, canvasId, user, c).catch(() => toast.error("Couldn't post the comment.")),
    onReply: (c, text) => replyToComment(folderId, canvasId, c.id, user, text).catch(() => toast.error("Couldn't post the reply.")),
    onResolve: (c, resolved) => {
      setCommentResolved(folderId, canvasId, c.id, user, resolved).catch(() => toast.error("Couldn't update the comment."));
      if (resolved && !showResolved) setOpenCommentId(null);
    },
    onDelete: (c) => {
      setOpenCommentId(null);
      deleteComment(folderId, canvasId, c.id).catch(() => toast.error("Couldn't delete the comment."));
    },
  };

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-surface-100 select-none dark:bg-surface-950">
      {/* Canvas viewport */}
      <div
        ref={viewportRef}
        className="canvas-dots absolute inset-0 touch-none outline-none"
        style={{ cursor }}
        onPointerDownCapture={onViewportPointerDownCapture}
        onPointerDown={onViewportPointerDown}
        onDragOver={(e) => {
          if (!canEdit) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropHint(true);
        }}
        onDragLeave={(e) => e.target === viewportRef.current && setDropHint(false)}
        onDrop={onDrop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div ref={worldRef} className="absolute top-0 left-0 origin-top-left" style={{ willChange: "transform" }}>
          {displayItems.map((item) => (
            <CanvasItem
              key={item.id}
              item={item}
              selected={selection.includes(item.id)}
              editing={editingId === item.id}
              active={activeId === item.id}
              canEdit={canEdit && tool === "select" && !spaceHeld}
              onPointerDown={onItemPointerDown}
              onDoubleClick={onItemDoubleClick}
              onResizeStart={onResizeStart}
              onOpen={openItem}
              onActivate={onActivate}
              onTextCommit={onTextCommit}
            />
          ))}
          {showComments && (
            <CommentLayer
              comments={comments}
              user={user}
              canComment={canComment}
              canEdit={canEdit}
              showResolved={showResolved}
              openId={openCommentId}
              setOpenId={setOpenCommentId}
              draft={draftComment}
              setDraft={setDraftComment}
              {...commentHandlers}
            />
          )}
        </div>
      </div>

      {marquee && (
        <div
          className="pointer-events-none fixed border border-primary-500 bg-primary-500/10"
          style={{
            left: Math.min(marquee.x1, marquee.x2),
            top: Math.min(marquee.y1, marquee.y2),
            width: Math.abs(marquee.x2 - marquee.x1),
            height: Math.abs(marquee.y2 - marquee.y1),
          }}
        />
      )}

      {dropHint && (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-2xl border-2 border-dashed border-primary-500 bg-primary-500/5">
          <span className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg">Drop to add to canvas</span>
        </div>
      )}

      {/* Empty / loading / blocked states */}
      {itemsQ.data && !items.length && !blocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-card dark:bg-surface-900">
              <FiMaximize2 className="h-5 w-5 text-primary-500" />
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-surface-100">
              {canEdit ? "Paste or drop anything" : "This canvas is empty"}
            </h2>
            {canEdit && (
              <p className="mt-1.5 text-sm leading-relaxed text-surface-500">
                Images, screenshots, YouTube / Vimeo / Loom links, files and text all land here. The canvas is infinite — drag
                to pan, scroll to zoom.
              </p>
            )}
          </div>
        </div>
      )}

      {(folderQ.loading || itemsQ.loading) && !blocked && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-surface-500">
          <Spinner className="h-4 w-4" /> Loading canvas…
        </div>
      )}

      {blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-50 p-6 dark:bg-surface-950">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-200 text-surface-600 dark:bg-surface-800 dark:text-surface-300">
              <FiLock className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-surface-100">
              {folderQ.error || folder === null ? "You don't have access to this folder" : "This canvas doesn't exist"}
            </h2>
            <p className="mt-1.5 text-sm text-surface-500">
              {folderQ.error || folder === null
                ? `Ask the owner to invite ${user.email}. Invites only work for verified emails.`
                : "It may have been deleted."}
            </p>
            <Link to="/ideas" className="mt-5 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              Back to Ideas
            </Link>
          </div>
        </div>
      )}

      {!blocked && folder && canvas && (
        <>
          {/* Top bar */}
          <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex flex-wrap items-start justify-between gap-2">
            <div className={cn(panel, "flex min-w-0 items-center gap-1 p-1")}>
              <Link
                to={`/ideas/${folderId}`}
                aria-label="Back to folder"
                className="rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-900 dark:hover:bg-surface-800 dark:hover:text-white"
              >
                <FiArrowLeft className="h-4 w-4" />
              </Link>
              <Menu
                align="left"
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    <span className="hidden max-w-40 truncate text-sm text-surface-500 sm:inline">{folder.name} /</span>
                    <span className="max-w-48 truncate text-sm font-semibold text-surface-900 dark:text-surface-50">{canvas.name}</span>
                    <FiChevronDown className="h-3.5 w-3.5 shrink-0 text-surface-400" />
                  </button>
                )}
              >
                <p className="px-2.5 pt-1 pb-1.5 text-xs text-surface-500">Canvases in {folder.name}</p>
                <div className="scrollbar-thin max-h-64 overflow-y-auto" data-no-wheel>
                  {canvases.map((c) => (
                    <MenuItem key={c.id} icon={c.id === canvasId ? FiCheck : undefined} onClick={() => navigate(`/ideas/${folderId}/${c.id}`)} className={c.id !== canvasId ? "pl-8" : ""}>
                      <span className="truncate">{c.name}</span>
                    </MenuItem>
                  ))}
                </div>
                {canEdit && (
                  <>
                    <MenuSeparator />
                    <MenuItem icon={FiPlus} onClick={() => setDialog("newCanvas")}>
                      New canvas
                    </MenuItem>
                    <MenuItem icon={FiEdit2} onClick={() => setDialog("renameCanvas")}>
                      Rename canvas
                    </MenuItem>
                    <MenuItem icon={FiTrash2} danger onClick={() => setDialog("deleteCanvas")}>
                      Delete canvas
                    </MenuItem>
                  </>
                )}
              </Menu>
              {role !== "owner" && (
                <span className="mr-1 hidden rounded-md bg-surface-100 px-2 py-1 text-[11px] font-medium text-surface-600 sm:inline dark:bg-surface-800 dark:text-surface-300">
                  {ROLES[role]?.label}
                </span>
              )}
            </div>

            <div className={cn(panel, "flex items-center gap-1 p-1")}>
              {Object.keys(folder.members || {}).length > 0 && (
                <div className="hidden px-1.5 sm:block">
                  <AvatarStack names={[folder.ownerName || folder.ownerEmail, ...Object.keys(folder.members)]} max={4} size="sm" />
                </div>
              )}
              <Menu
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    title="Comments"
                    className={cn(
                      "relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition-colors hover:bg-surface-100 dark:hover:bg-surface-800",
                      showComments ? "text-surface-800 dark:text-surface-100" : "text-surface-400"
                    )}
                  >
                    <FiMessageCircle className="h-4 w-4" />
                    {unresolved > 0 && <span className="text-xs font-semibold tabular-nums">{unresolved}</span>}
                  </button>
                )}
              >
                <MenuItem icon={showComments ? FiCheck : undefined} className={showComments ? "" : "pl-8"} onClick={() => setShowComments((s) => !s)}>
                  Show comments
                </MenuItem>
                <MenuItem icon={showResolved ? FiCheck : undefined} className={showResolved ? "" : "pl-8"} onClick={() => setShowResolved((s) => !s)}>
                  Show resolved
                </MenuItem>
                {canComment && (
                  <>
                    <MenuSeparator />
                    <MenuItem icon={FiMessageCircle} onClick={() => setTool("comment")}>
                      Add comment (C)
                    </MenuItem>
                  </>
                )}
              </Menu>
              {role === "owner" ? (
                <button
                  type="button"
                  onClick={() => setDialog("share")}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
                >
                  <FiShare2 className="h-3.5 w-3.5" /> Share
                </button>
              ) : (
                <span className="hidden px-2 text-xs text-surface-500 md:inline">Shared by {folder.ownerName || folder.ownerEmail}</span>
              )}
            </div>
          </div>

          {/* Selection bar */}
          {canEdit && selectedItems.length > 0 && !editingId && (
            <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
              <div className={cn(panel, "flex items-center gap-0.5 p-1 text-sm")}>
                <span className="px-2.5 text-xs text-surface-500">{selectedItems.length} selected</span>
                {selectedItems.every((i) => i.type === "sticky") &&
                  Object.entries(STICKY_SWATCHES).map(([key, cls]) => (
                    <button
                      key={key}
                      type="button"
                      aria-label={`${key} sticky`}
                      onClick={() => commitGeometry(selectedItems.map((i) => ({ id: i.id, color: key })))}
                      className={cn("mx-0.5 h-5 w-5 rounded-full ring-offset-1 hover:scale-110", cls, selectedItems[0].color === key && "ring-2 ring-primary-500")}
                    />
                  ))}
                {selectedItems.length === 1 && OPENABLE.has(selectedItems[0].type) && (
                  <ToolButton icon={FiMaximize2} label="Open full quality" shortcut="Enter" onClick={() => openItem(selectedItems[0])} />
                )}
                <ToolButton icon={FiArrowUp} label="Bring to front" onClick={() => restack(selection, true)} />
                <ToolButton icon={FiArrowDown} label="Send to back" onClick={() => restack(selection, false)} />
                <ToolButton icon={FiCopy} label="Duplicate" shortcut="Ctrl+D" onClick={() => duplicate(selection)} />
                <ToolButton icon={FiTrash2} label="Delete" shortcut="Del" onClick={() => removeItems(selection)} />
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
            <div className={cn(panel, "flex items-center gap-0.5 p-1")}>
              <ToolButton icon={FiMousePointer} label="Select" shortcut="V" active={tool === "select" && !spaceHeld} onClick={() => setTool("select")} />
              <ToolButton icon={FiMove} label="Hand" shortcut="H" active={tool === "hand" || spaceHeld} onClick={() => setTool("hand")} />
              {canEdit && (
                <>
                  <span className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
                  <ToolButton icon={FiFileText} label="Note" shortcut="N" active={tool === "note"} onClick={() => setTool("note")} />
                  <ToolButton icon={MdOutlineStickyNote2} label="Sticky" shortcut="S" active={tool === "sticky"} onClick={() => setTool("sticky")} />
                  <ToolButton icon={FiLink} label="Link or video" shortcut="L" onClick={() => setDialog("link")} />
                  <ToolButton icon={FiUpload} label="Upload files" shortcut="U" onClick={() => fileInputRef.current?.click()} />
                </>
              )}
              {canComment && (
                <>
                  <span className="mx-1 h-5 w-px bg-surface-200 dark:bg-surface-700" />
                  <ToolButton icon={FiMessageCircle} label="Comment" shortcut="C" active={tool === "comment"} onClick={() => setTool("comment")} />
                </>
              )}
            </div>
          </div>

          {/* Zoom + help */}
          <div className="pointer-events-none absolute right-3 bottom-4 z-20 hidden sm:block">
            <div className={cn(panel, "flex items-center p-1")}>
              <ToolButton icon={FiMinus} label="Zoom out" shortcut="-" onClick={() => zoomBy(0.8)} />
              <button
                type="button"
                title="Reset to 100%"
                onClick={() => zoomBy(1 / cam.current.z)}
                className="h-9 w-14 rounded-lg text-xs font-medium text-surface-600 tabular-nums hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
              >
                {zoomPct}%
              </button>
              <ToolButton icon={FiPlus} label="Zoom in" shortcut="+" onClick={() => zoomBy(1.25)} />
              <ToolButton icon={FiMaximize} label="Zoom to fit" shortcut="F" onClick={() => fitTo(displayItems)} />
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-3 z-20 hidden sm:block">
            <div className="pointer-events-auto">
              <Menu
                side="top"
                align="left"
                className="w-72"
                trigger={({ toggle }) => (
                  <button type="button" onClick={toggle} aria-label="Keyboard shortcuts" className={cn(panel, "flex h-11 w-11 items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white")}>
                    <FiHelpCircle className="h-4 w-4" />
                  </button>
                )}
              >
                <div className="p-2">
                  <p className="mb-2 text-xs font-semibold text-surface-900 dark:text-surface-100">Canvas shortcuts</p>
                  {shortcuts.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 py-1 text-xs">
                      <span className="text-surface-500">{v}</span>
                      <span className="font-medium text-surface-800 dark:text-surface-200">{k}</span>
                    </div>
                  ))}
                </div>
              </Menu>
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...e.target.files];
          e.target.value = "";
          insertFiles(ctx, files, viewCenter());
        }}
      />

      {viewer && (
        <AssetViewer
          folderId={folderId}
          items={viewer.ids.map((id) => byId.get(id)).filter(Boolean)}
          index={viewer.index}
          onIndexChange={(index) => setViewer((v) => ({ ...v, index }))}
          onClose={() => setViewer(null)}
        />
      )}

      <ShareModal isOpen={dialog === "share"} onClose={() => setDialog(null)} folder={folder} user={user} />

      <PromptDialog
        isOpen={dialog === "link"}
        onClose={() => setDialog(null)}
        title="Add a link or video"
        description="YouTube, Vimeo, Loom, Spotify, Figma and direct image/video links are embedded."
        label="URL"
        placeholder="https://youtube.com/watch?v=…"
        submitLabel="Add"
        validate={(v) => (analyzeUrl(v) ? null : "Enter a valid http(s) link.")}
        onSubmit={(v) => insertUrl(ctx, v, viewCenter())}
      />
      <PromptDialog
        isOpen={dialog === "newCanvas"}
        onClose={() => setDialog(null)}
        title="New canvas"
        label="Name"
        initialValue={`Canvas ${canvases.length + 1}`}
        submitLabel="Create"
        onSubmit={async (name) => navigate(`/ideas/${folderId}/${await createCanvas(folderId, name, user)}`)}
      />
      <PromptDialog
        isOpen={dialog === "renameCanvas"}
        onClose={() => setDialog(null)}
        title="Rename canvas"
        label="Name"
        initialValue={canvas?.name || ""}
        onSubmit={(name) => renameCanvas(folderId, canvasId, name)}
      />
      <ConfirmDialog
        isOpen={dialog === "deleteCanvas"}
        onClose={() => setDialog(null)}
        title={`Delete “${canvas?.name}”?`}
        description="Everything on this canvas — images, videos, notes and comments — will be permanently deleted for everyone in the folder."
        confirmLabel="Delete canvas"
        onConfirm={async () => {
          await deleteCanvas(folderId, canvasId);
          navigate(`/ideas/${folderId}`);
        }}
      />
    </div>
  );
};

export default CanvasPage;
