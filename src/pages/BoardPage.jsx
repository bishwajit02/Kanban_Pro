import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";

import Board from "../components/Board";
import TableView from "../components/TableView";
import BoardHeader from "../components/BoardHeader";
import BoardStats from "../components/BoardStats";
import BoardFilters from "../components/BoardFilters";
import CardModal from "../components/CardModal";

const emptyBoard = [
  { id: 1, title: "To Do", cards: [] },
  { id: 2, title: "In Progress", cards: [] },
  { id: 3, title: "Done", cards: [] },
];

const BoardPage = ({ user }) => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Board Info
  const [boardName, setBoardName] = useState("My Kanban Board");
  const [boardDescription, setBoardDescription] = useState(
    "A modern, Notion-inspired Kanban board."
  );
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchBoard = async () => {
      setLoading(true);
      const ref = doc(db, "boards", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBoard(data.board);
        if (data.name) setBoardName(data.name);
        if (data.description) setBoardDescription(data.description);
      } else {
        await setDoc(ref, { 
          board: emptyBoard,
          name: boardName,
          description: boardDescription
        });
        setBoard(emptyBoard);
      }
      setLoading(false);
    };
    fetchBoard();
  }, [user]);

  const saveBoard = async (newBoard, name, desc) => {
    if (!user) return;
    const ref = doc(db, "boards", user.uid);
    await updateDoc(ref, { 
      board: newBoard || board,
      name: name || boardName,
      description: desc || boardDescription
    });
  };

  const getBoardStats = () => {
    if (!board) return { total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, highPriority: 0 };

    const allCards = board.flatMap((col) => col.cards);
    return {
      total: allCards.length,
      todo: board.find((col) => col.title === "To Do")?.cards.length || 0,
      inProgress: board.find((col) => col.title === "In Progress")?.cards.length || 0,
      done: board.find((col) => col.title === "Done")?.cards.length || 0,
      overdue: allCards.filter(c => c.dueDate && new Date(c.dueDate) < new Date()).length,
      highPriority: allCards.filter(c => c.priority === "High").length,
    };
  };

  const handleAddTask = (columnId = 1) => {
    setActiveColumnId(columnId);
    setActiveCard(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditCard = (columnId, card) => {
    setActiveColumnId(columnId);
    setActiveCard(card);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveCard = (cardData) => {
    let newBoard;
    if (isEditMode) {
      newBoard = board.map((col) =>
        col.id === activeColumnId
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c.id === activeCard.id ? { ...cardData, id: activeCard.id } : c
              ),
            }
          : col
      );
    } else {
      newBoard = board.map((col) =>
        col.id === activeColumnId
          ? { ...col, cards: [...col.cards, { id: Date.now(), ...cardData }] }
          : col
      );
    }
    setBoard(newBoard);
    saveBoard(newBoard);
    setIsModalOpen(false);
  };

  const handleDeleteCard = (columnId, cardId) => {
    const newBoard = board.map((col) =>
      col.id === columnId
        ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
        : col
    );
    setBoard(newBoard);
    saveBoard(newBoard);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === "COLUMN") {
      const newBoard = Array.from(board);
      const [removed] = newBoard.splice(source.index, 1);
      newBoard.splice(destination.index, 0, removed);
      setBoard(newBoard);
      saveBoard(newBoard);
    } else {
      const sourceCol = board.find((c) => String(c.id) === source.droppableId);
      const destCol = board.find((c) => String(c.id) === destination.droppableId);

      if (!sourceCol || !destCol) return;

      const sourceCards = Array.from(sourceCol.cards);
      const [removed] = sourceCards.splice(source.index, 1);

      let newBoard;
      if (sourceCol.id === destCol.id) {
        sourceCards.splice(destination.index, 0, removed);
        newBoard = board.map((col) =>
          col.id === sourceCol.id ? { ...col, cards: sourceCards } : col
        );
      } else {
        const destCards = Array.from(destCol.cards);
        destCards.splice(destination.index, 0, removed);
        newBoard = board.map((col) => {
          if (col.id === sourceCol.id) return { ...col, cards: sourceCards };
          if (col.id === destCol.id) return { ...col, cards: destCards };
          return col;
        });
      }
      setBoard(newBoard);
      saveBoard(newBoard);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <div className="text-2xl font-black text-surface-900 dark:text-surface-100">
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <BoardHeader
        boardName={boardName}
        boardDescription={boardDescription}
        editingName={editingName}
        editingDesc={editingDesc}
        setBoardName={setBoardName}
        setBoardDescription={setBoardDescription}
        setEditingName={setEditingName}
        setEditingDesc={setEditingDesc}
        view={view}
        setView={setView}
        onAddTask={() => handleAddTask(1)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="container mx-auto py-8 space-y-8 flex-1 flex flex-col overflow-hidden">
          <BoardStats stats={getBoardStats()} />
          
          <BoardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          <div className="flex-1 overflow-hidden flex flex-col">
            {view === "kanban" ? (
              <Board
                board={board}
                onAddCard={handleAddTask}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onDragEnd={handleDragEnd}
              />
            ) : (
              <TableView
                board={board}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
              />
            )}
          </div>
        </div>
      </main>

      <CardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCard}
        card={activeCard}
        isEdit={isEditMode}
      />
    </div>
  );
};

export default BoardPage;
