import React, { useState, useRef, useEffect } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Badge from "./ui/Badge";
import {
  FaPlus,
  FaTimes,
  FaGithub,
  FaCalendarAlt,
  FaImage,
  FaTrash,
  FaTag,
  FaFlag,
} from "react-icons/fa";

const priorities = ["Low", "Medium", "High"];
const allUsers = [
  { name: "Jane Doe", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { name: "John Smith", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  { name: "Alice Lee", avatar: "https://randomuser.me/api/portraits/women/46.jpg" },
];

const CardModal = ({
  isOpen,
  onClose,
  onSave,
  card,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    content: "",
    description: "",
    githubLink: "",
    images: [],
    tags: [],
    priority: "Medium",
    dueDate: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [tagDropdown, setTagDropdown] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    if (card) {
      setFormData({
        content: card.content || "",
        description: card.description || "",
        githubLink: card.githubLink || "",
        images: card.images || [],
        tags: card.tags || [],
        priority: card.priority || "Medium",
        dueDate: card.dueDate || "",
      });
    } else {
      setFormData({
        content: "",
        description: "",
        githubLink: "",
        images: [],
        tags: [],
        priority: "Medium",
        dueDate: "",
      });
    }
  }, [card, isOpen]);

  useEffect(() => {
    if (tagInput.startsWith("@")) {
      const search = tagInput.slice(1).toLowerCase();
      setTagDropdown(
        allUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(search) &&
            !formData.tags.includes(u.name)
        )
      );
    } else {
      setTagDropdown([]);
    }
  }, [tagInput, formData.tags]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((images) => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...images],
      }));
    });
  };

  const handleRemoveImage = (idx) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleAddTag = (userName) => {
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, userName],
    }));
    setTagInput("");
    setTagDropdown([]);
  };

  const handleRemoveTag = (userName) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== userName),
    }));
  };

  const handleSubmit = () => {
    if (!formData.content.trim()) return;
    onSave(formData);
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>
        {isEdit ? "Save Changes" : "Create Task"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Task" : "Create New Task"}
      footer={footer}
      size="lg"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Input
            label="Task Title"
            placeholder="What needs to be done?"
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            autoFocus
          />

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">
              Description
            </label>
            <textarea
              placeholder="Add more details..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full h-32 px-4 py-3 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300">
                Attachments
              </label>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={FaPlus}
                onClick={() => fileInputRef.current?.click()}
              >
                Add Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {formData.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-video rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 shadow-sm"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="p-2 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors shadow-lg"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Meta Info */}
        <div className="space-y-6 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-2xl border border-surface-200 dark:border-surface-700">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <FaFlag className="w-4 h-4 text-primary-500" />
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, priority: p }))
                  }
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                    formData.priority === p
                      ? p === "High"
                        ? "bg-error-500 text-white shadow-md scale-105"
                        : p === "Medium"
                        ? "bg-warning-500 text-white shadow-md scale-105"
                        : "bg-success-500 text-white shadow-md scale-105"
                      : "bg-white dark:bg-surface-700 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <FaCalendarAlt className="w-4 h-4 text-primary-500" />
              Due Date
            </label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <FaTag className="w-4 h-4 text-primary-500" />
              Assignees
            </label>
            <div className="relative">
              <Input
                placeholder="Type @ to assign..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                leftIcon={FaPlus}
              />
              {tagDropdown.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl overflow-hidden animate-scale-in">
                  {tagDropdown.map((u) => (
                    <button
                      key={u.name}
                      onClick={() => handleAddTag(u.name)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <img
                        src={u.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full border border-surface-200 dark:border-surface-600"
                      />
                      <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                        {u.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="primary"
                  className="pl-1 pr-2 py-1 flex items-center gap-2 group cursor-default"
                >
                  <img
                    src={allUsers.find((u) => u.name === tag)?.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-error-500 transition-colors p-0.5"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <FaGithub className="w-4 h-4 text-primary-500" />
              GitHub Link
            </label>
            <Input
              placeholder="https://github.com/..."
              value={formData.githubLink}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, githubLink: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CardModal;
