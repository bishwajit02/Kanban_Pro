import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FiAlertTriangle } from "react-icons/fi";
import { db } from "../config/firebase";
import { toast } from "../lib/toast";
import { daysUntil, isTypingTarget, newId } from "../lib/utils";
import Board from "../components/board/Board";
import BoardFilters from "../components/board/BoardFilters";
import BoardHeader from "../components/board/BoardHeader";
import BoardStats from "../components/board/BoardStats";
import CardModal from "../components/board/CardModal";
import TableView from "../components/board/TableView";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Spinner";

const DEFAULT_NAME = "Product Roadmap";
const DEFAULT_DESCRIPTION = "Plan, prioritise and ship — all in one place.";
const emptyBoard = () => [
  { id: newId(), title: "To Do", cards: [] },
  { id: newId(), title: "In Progress", cards: [] },
  { id: newId(), title: "Done", cards: [] },
];

// Firestore rejects documents over 1 MiB; leave headroom for metadata.
const MAX_DOC_CHARS = 950_000;

/** The column that counts as "completed": one titled Done, else the last column. */
const doneColumnId = (board) =>
  (board.find((c) => c.title.trim().toLowerCase() === "done") || board[board.length - 1])?.id;

const BoardPage = ({ user }) => {
  const [board, setBoard] = useState(null);
  const [meta, setMeta] = useState({ name: DEFAULT_NAME, description: DEFAULT_DESCRIPTION });
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState("saved");
  const [view, setView] = useState("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [modal, setModal] = useState(null); // { columnId, card | null }
  const boardRef = useRef(null);
  const searchRef = useRef(null);
  const saveSeq = useRef(0);

  const ref = useMemo(() => doc(db, "boards", user.uid), [user.uid]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        boardRef.current = Array.isArray(data.board) ? data.board : emptyBoard();
        setMeta({
          name: data.name || DEFAULT_NAME,
          description: data.description ?? DEFAULT_DESCRIPTION,
        });
      } else {
        boardRef.current = emptyBoard();
        await setDoc(ref, { board: boardRef.current, name: DEFAULT_NAME, description: DEFAULT_DESCRIPTION });
      }
      setBoard(boardRef.current);
    } catch (err) {
      console.error("Failed to load board", err);
      setLoadError(err);
    }
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(
    async (patch) => {
      if (patch.board && JSON.stringify(patch.board).length > MAX_DOC_CHARS) {
        toast.error("This board is too large to save. Remove some image attachments and try again.");
        setSaveState("error");
        return;
      }
      const seq = ++saveSeq.current;
      setSaveState("saving");
      try {
        await setDoc(ref, patch, { merge: true });
        if (seq === saveSeq.current) setSaveState("saved");
      } catch (err) {
        console.error("Failed to save board", err);
        setSaveState("error");
        toast.error("Changes couldn't be saved. Check your connection.");
      }
    },
    [ref]
  );

  /** Apply an update to the board, render it and persist it. */
  const commit = useCallback(
    (updater) => {
      const next = updater(boardRef.current);
      boardRef.current = next;
      setBoard(next);
      persist({ board: next });
    },
    [persist]
  );

  const updateMeta = (patch) => {
    setMeta((m) => ({ ...m, ...patch }));
    persist(patch);
  };

  // ---- Cards ----------------------------------------------------------------

  const openNewCard = useCallback((columnId) => {
    setModal({ columnId: columnId ?? boardRef.current?.[0]?.id, card: null });
  }, []);

  const openCard = (columnId, card) => setModal({ columnId, card });

  const handleSaveCard = ({ columnId: targetColumnId, ...data }) => {
    const { columnId: originColumnId, card } = modal;
    commit((cols) => {
      if (!card) {
        const created = { id: newId(), createdAt: new Date().toISOString(), ...data };
        return cols.map((c) => (c.id === targetColumnId ? { ...c, cards: [...c.cards, created] } : c));
      }
      const updated = { ...card, ...data, updatedAt: new Date().toISOString() };
      if (originColumnId === targetColumnId) {
        return cols.map((c) =>
          c.id === originColumnId ? { ...c, cards: c.cards.map((x) => (x.id === card.id ? updated : x)) } : c
        );
      }
      return cols.map((c) => {
        if (c.id === originColumnId) return { ...c, cards: c.cards.filter((x) => x.id !== card.id) };
        if (c.id === targetColumnId) return { ...c, cards: [...c.cards, updated] };
        return c;
      });
    });
    setModal(null);
    toast.success(card ? "Task updated" : "Task created");
  };

  const handleDeleteCard = (columnId, cardId) => {
    const column = boardRef.current.find((c) => c.id === columnId);
    const index = column?.cards.findIndex((c) => c.id === cardId) ?? -1;
    if (index < 0) return;
    const removed = column.cards[index];
    commit((cols) =>
      cols.map((c) => (c.id === columnId ? { ...c, cards: c.cards.filter((x) => x.id !== cardId) } : c))
    );
    setModal(null);
    toast("Task deleted", {
      action: {
        label: "Undo",
        onClick: () =>
          commit((cols) =>
            cols.map((c) => {
              if (c.id !== columnId) return c;
              const cards = [...c.cards];
              cards.splice(Math.min(index, cards.length), 0, removed);
              return { ...c, cards };
            })
          ),
      },
    });
  };

  // ---- Columns --------------------------------------------------------------

  const handleAddColumn = (title) =>
    commit((cols) => [...cols, { id: newId(), title, cards: [] }]);

  const handleRenameColumn = (columnId, title) =>
    commit((cols) => cols.map((c) => (c.id === columnId ? { ...c, title } : c)));

  const handleDeleteColumn = (columnId) => {
    const cols = boardRef.current;
    if (cols.length <= 1) {
      toast.error("A board needs at least one column.");
      return;
    }
    const index = cols.findIndex((c) => c.id === columnId);
    const removed = cols[index];
    commit((prev) => prev.filter((c) => c.id !== columnId));
    toast(`Deleted “${removed.title}”${removed.cards.length ? ` and ${removed.cards.length} tasks` : ""}`, {
      action: {
        label: "Undo",
        onClick: () =>
          commit((prev) => {
            const next = [...prev];
            next.splice(Math.min(index, next.length), 0, removed);
            return next;
          }),
      },
    });
  };

  // ---- Drag & drop ----------------------------------------------------------

  const handleDragEnd = ({ source, destination, type }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "COLUMN") {
      commit((cols) => {
        const next = [...cols];
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return next;
      });
      return;
    }

    commit((cols) => {
      const from = cols.find((c) => String(c.id) === source.droppableId);
      const to = cols.find((c) => String(c.id) === destination.droppableId);
      if (!from || !to) return cols;
      const fromCards = [...from.cards];
      const [moved] = fromCards.splice(source.index, 1);
      if (from.id === to.id) {
        fromCards.splice(destination.index, 0, moved);
        return cols.map((c) => (c.id === from.id ? { ...c, cards: fromCards } : c));
      }
      const toCards = [...to.cards];
      toCards.splice(destination.index, 0, moved);
      return cols.map((c) => {
        if (c.id === from.id) return { ...c, cards: fromCards };
        if (c.id === to.id) return { ...c, cards: toCards };
        return c;
      });
    });
  };

  // ---- Derived data ---------------------------------------------------------

  const isFiltering = searchTerm.trim() !== "" || priorityFilter !== "All";

  const visibleBoard = useMemo(() => {
    if (!board || !isFiltering) return board;
    const q = searchTerm.trim().toLowerCase();
    return board.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => {
        if (priorityFilter !== "All" && card.priority !== priorityFilter) return false;
        if (!q) return true;
        return [card.content, card.description, ...(card.tags || [])].some((v) =>
          v?.toLowerCase().includes(q)
        );
      }),
    }));
  }, [board, isFiltering, searchTerm, priorityFilter]);

  const stats = useMemo(() => {
    if (!board) return null;
    const doneId = doneColumnId(board);
    const open = board.filter((c) => c.id !== doneId).flatMap((c) => c.cards);
    const total = board.reduce((n, c) => n + c.cards.length, 0);
    const done = board.find((c) => c.id === doneId)?.cards.length || 0;
    return {
      total,
      done,
      open: open.length,
      overdue: open.filter((c) => (daysUntil(c.dueDate) ?? 0) < 0).length,
      dueSoon: open.filter((c) => {
        const d = daysUntil(c.dueDate);
        return d !== null && d >= 0 && d <= 2;
      }).length,
      highPriority: open.filter((c) => c.priority === "High").length,
    };
  }, [board]);

  // ---- Keyboard shortcuts ---------------------------------------------------

  useEffect(() => {
    const onKey = (e) => {
      if (modal || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "n" || e.key === "c") {
        e.preventDefault();
        openNewCard();
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, openNewCard]);

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
            <FiAlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100">Couldn't load your board</h2>
          <p className="mt-1 mb-5 text-sm text-surface-500">Check your connection and try again.</p>
          <Button onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!board) return <PageLoader label="Loading board…" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BoardHeader
        name={meta.name}
        description={meta.description}
        onRename={(name) => updateMeta({ name })}
        onDescribe={(description) => updateMeta({ description })}
        view={view}
        setView={setView}
        saveState={saveState}
        onAddTask={() => openNewCard()}
      />

      <div className="space-y-4 px-4 pt-5 sm:px-6 lg:px-8">
        <BoardStats stats={stats} />
        <BoardFilters
          ref={searchRef}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          priority={priorityFilter}
          setPriority={setPriorityFilter}
          isFiltering={isFiltering}
          onClear={() => {
            setSearchTerm("");
            setPriorityFilter("All");
          }}
        />
      </div>

      <div className="flex min-h-112 flex-1 flex-col pt-4 pb-4">
        {view === "kanban" ? (
          <Board
            board={visibleBoard}
            dragDisabled={isFiltering}
            doneColumnId={doneColumnId(board)}
            onAddCard={openNewCard}
            onEditCard={openCard}
            onDeleteCard={handleDeleteCard}
            onDragEnd={handleDragEnd}
            onAddColumn={handleAddColumn}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        ) : (
          <TableView
            board={visibleBoard}
            isFiltering={isFiltering}
            onEditCard={openCard}
            onDeleteCard={handleDeleteCard}
            onAddCard={() => openNewCard()}
          />
        )}
      </div>

      <CardModal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        onSave={handleSaveCard}
        onDelete={modal?.card ? () => handleDeleteCard(modal.columnId, modal.card.id) : undefined}
        card={modal?.card}
        columnId={modal?.columnId}
        columns={board}
      />
    </div>
  );
};

export default BoardPage;
