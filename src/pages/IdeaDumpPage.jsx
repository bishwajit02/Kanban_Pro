import React, { useRef, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus,
  FaFolder,
  FaEdit,
  FaTrash,
  FaImage,
  FaLink,
  FaFileAlt,
  FaStickyNote,
  FaFilePdf,
  FaSave,
  FaTimes,
  FaYoutube,
  FaExternalLinkAlt,
  FaEllipsisV,
} from "react-icons/fa";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const initialFolders = [{ id: 1, name: "General", items: [] }];
const stickyColors = [
  { bg: "bg-yellow-200", text: "text-yellow-900", border: "border-yellow-300", label: "Yellow" },
  { bg: "bg-pink-200", text: "text-pink-900", border: "border-pink-300", label: "Pink" },
  { bg: "bg-green-200", text: "text-green-900", border: "border-green-300", label: "Green" },
  { bg: "bg-blue-200", text: "text-blue-900", border: "border-blue-300", label: "Blue" },
  { bg: "bg-purple-200", text: "text-purple-900", border: "border-purple-300", label: "Purple" },
];

const IdeaDumpPage = () => {
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem("idea_folders");
    return saved ? JSON.parse(saved) : initialFolders;
  });
  const [activeFolderId, setActiveFolderId] = useState(1);
  const [addingType, setAddingType] = useState(null); 
  const [inputValue, setInputValue] = useState("");
  const [stickyColor, setStickyColor] = useState(stickyColors[0]);
  const fileInputRef = useRef();
  const pdfInputRef = useRef();
  const [renamingFolderId, setRenamingFolderId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    localStorage.setItem("idea_folders", JSON.stringify(folders));
  }, [folders]);

  const handleAddFolder = () => {
    const newId = Date.now();
    setFolders((prev) => [
      ...prev,
      { id: newId, name: `New Folder`, items: [] },
    ]);
    setActiveFolderId(newId);
    setRenamingFolderId(newId);
    setRenameValue("New Folder");
  };

  const handleRenameFolder = (id) => {
    if (!renameValue.trim()) {
      setRenamingFolderId(null);
      return;
    }
    setFolders((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: renameValue.trim() } : f
      )
    );
    setRenamingFolderId(null);
  };

  const handleDeleteFolder = (id) => {
    if (folders.length <= 1) return;
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolderId === id) {
      setActiveFolderId(folders.find((f) => f.id !== id).id);
    }
  };

  const handleAddItem = (type) => {
    setAddingType(type);
    setInputValue("");
  };

  const confirmAddItem = () => {
    if (!inputValue.trim() && addingType !== "image" && addingType !== "pdf") return;
    
    const newItem = {
      id: Date.now(),
      type: addingType,
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    if (addingType === "sticky") {
      newItem.color = stickyColor;
    }

    setFolders(prev => prev.map(f => 
      f.id === activeFolderId ? { ...f, items: [newItem, ...f.items] } : f
    ));
    setAddingType(null);
    setInputValue("");
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newItem = {
        id: Date.now(),
        type,
        content: ev.target.result,
        name: file.name,
        size: file.size,
        timestamp: new Date().toISOString(),
      };
      setFolders(prev => prev.map(f => 
        f.id === activeFolderId ? { ...f, items: [newItem, ...f.items] } : f
      ));
    };
    reader.readAsDataURL(file);
    setAddingType(null);
  };

  const handleDeleteItem = (itemId) => {
    setFolders(prev => prev.map(f => 
      f.id === activeFolderId ? { ...f, items: f.items.filter(i => i.id !== itemId) } : f
    ));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const folder = folders.find(f => f.id === activeFolderId);
    const items = Array.from(folder.items);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    
    setFolders(prev => prev.map(f => 
      f.id === activeFolderId ? { ...f, items } : f
    ));
  };

  const activeFolder = folders.find((f) => f.id === activeFolderId) || folders[0];

  const renderItem = (item) => {
    switch (item.type) {
      case "image":
        return (
          <div className="group relative rounded-3xl overflow-hidden shadow-lg aspect-square">
            <img src={item.content} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" className="bg-white/20 text-white backdrop-blur-md" onClick={() => window.open(item.content)}>View</Button>
              <Button variant="error" size="sm" onClick={() => handleDeleteItem(item.id)}><FaTrash /></Button>
            </div>
          </div>
        );
      case "sticky":
        return (
          <div className={`p-8 rounded-3xl shadow-xl transform rotate-1 group relative transition-transform hover:rotate-0 h-64 flex flex-col ${item.color.bg} ${item.color.text} border-b-4 ${item.color.border}`}>
            <p className="text-lg font-black leading-tight flex-1 overflow-y-auto custom-scrollbar">{item.content}</p>
            <div className="pt-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sticky Note</span>
              <button onClick={() => handleDeleteItem(item.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-black/5 rounded-xl transition-all"><FaTrash className="w-4 h-4" /></button>
            </div>
          </div>
        );
      case "text":
        return (
          <Card className="p-8 group relative h-64 flex flex-col rounded-3xl">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-base font-bold text-surface-700 dark:text-surface-200 whitespace-pre-wrap">{item.content}</p>
            </div>
            <div className="pt-6 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <Badge variant="surface" size="sm" icon={FaFileAlt}>TEXT NOTE</Badge>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="p-2"><FaEdit /></Button>
                <Button variant="ghost" size="sm" className="p-2 text-error-500" onClick={() => handleDeleteItem(item.id)}><FaTrash /></Button>
              </div>
            </div>
          </Card>
        );
      case "link":
        const isYoutube = item.content.includes("youtube.com") || item.content.includes("youtu.be");
        return (
          <Card className="p-8 group relative rounded-3xl border-2 border-primary-500/10 hover:border-primary-500/30 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isYoutube ? "bg-error-50 text-error-600" : "bg-primary-50 text-primary-600"}`}>
                {isYoutube ? <FaYoutube className="w-7 h-7" /> : <FaLink className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-surface-900 dark:text-surface-100 truncate uppercase tracking-tight">External Link</h4>
                <a href={item.content} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-500 truncate block hover:underline">
                  {item.content.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => window.open(item.content)} className="rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest">
                Open Link <FaExternalLinkAlt className="ml-2 w-2.5 h-2.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-surface-300 hover:text-error-500"><FaTrash /></Button>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-surface-900 dark:text-surface-100 tracking-tight">Idea Dump</h1>
            <p className="text-xl text-surface-500 dark:text-surface-400 font-medium">Capture inspiration, snippets, and creative sparks.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button leftIcon={FaStickyNote} onClick={() => handleAddItem("sticky")} className="rounded-2xl shadow-lg">New Sticky</Button>
            <Button variant="secondary" leftIcon={FaPlus} onClick={() => handleAddItem("text")} className="rounded-2xl border-2">Text Snippet</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Folders Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-surface-400 uppercase tracking-[0.2em]">Folders</h3>
              <button onClick={handleAddFolder} className="p-2 bg-surface-100 dark:bg-surface-800 rounded-xl hover:bg-primary-500 hover:text-white transition-all"><FaPlus className="w-3 h-3" /></button>
            </div>
            <div className="space-y-2">
              {folders.map(f => (
                <div 
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                    activeFolderId === f.id 
                      ? "bg-white dark:bg-surface-900 shadow-xl ring-2 ring-primary-500/20 translate-x-2" 
                      : "hover:bg-surface-100 dark:hover:bg-surface-800"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeFolderId === f.id ? "bg-primary-500 text-white" : "bg-surface-100 dark:bg-surface-800 text-surface-400 group-hover:bg-surface-200"}`}>
                      <FaFolder className="w-5 h-5" />
                    </div>
                    {renamingFolderId === f.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameFolder(f.id)}
                        onKeyDown={e => e.key === "Enter" && handleRenameFolder(f.id)}
                        className="bg-transparent font-black text-surface-900 dark:text-surface-100 outline-none w-full"
                      />
                    ) : (
                      <span className={`font-black uppercase tracking-tight text-sm truncate ${activeFolderId === f.id ? "text-surface-900 dark:text-surface-100" : "text-surface-500"}`}>{f.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setRenamingFolderId(f.id); setRenameValue(f.name); }} className="p-1.5 text-surface-400 hover:text-primary-500"><FaEdit className="w-3.5 h-3.5" /></button>
                    {folders.length > 1 && <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} className="p-1.5 text-surface-400 hover:text-error-500"><FaTrash className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="lg:col-span-3 space-y-10">
            {/* Quick Actions */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-x-auto no-scrollbar">
              <button onClick={() => setAddingType("link")} className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-all font-black uppercase tracking-widest text-[10px] text-surface-600">
                <FaLink className="text-primary-500 w-4 h-4" /> Link
              </button>
              <div className="w-px h-8 bg-surface-100 dark:bg-surface-800" />
              <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 px-6 py-3 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-all font-black uppercase tracking-widest text-[10px] text-surface-600">
                <FaImage className="text-success-500 w-4 h-4" /> Image
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleFileUpload(e, "image")} />
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ideas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
                    {activeFolder.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            {renderItem(item)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!addingType && addingType !== "image" && addingType !== "pdf"} 
        onClose={() => setAddingType(null)}
        title={`Add ${addingType}`}
        footer={<><Button variant="ghost" onClick={() => setAddingType(null)}>Cancel</Button><Button onClick={confirmAddItem}>Add Item</Button></>}
      >
        <div className="space-y-6">
          {addingType === "sticky" && (
            <div className="flex gap-4 p-2 bg-surface-50 dark:bg-surface-800 rounded-2xl overflow-x-auto">
              {stickyColors.map(c => (
                <button 
                  key={c.label} 
                  onClick={() => setStickyColor(c)}
                  className={`w-12 h-12 rounded-xl flex-shrink-0 transition-all ${c.bg} ${stickyColor.label === c.label ? "ring-4 ring-primary-500/20 scale-110 shadow-lg" : "opacity-60 hover:opacity-100"}`}
                />
              ))}
            </div>
          )}
          <textarea
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={addingType === "sticky" ? "Write your thought..." : addingType === "link" ? "Paste URL here..." : "Type your note..."}
            className="w-full h-48 p-6 bg-surface-50 dark:bg-surface-800 border-none rounded-3xl text-lg font-bold focus:ring-4 ring-primary-500/10 transition-all resize-none"
          />
        </div>
      </Modal>
    </div>
  );
};

export default IdeaDumpPage;
