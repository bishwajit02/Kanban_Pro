import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaCog, FaChevronDown } from "react-icons/fa";

const ProfileMenu = ({ user }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex items-center gap-3 px-3 py-2 rounded-2xl transition-all duration-300 ${
          open 
            ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20" 
            : "hover:bg-surface-100 dark:hover:bg-surface-800"
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-surface-700 shadow-sm">
          <img
            src={user.photoURL}
            alt="avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.displayName || user.email
              )}&background=0ea5e9&color=fff`;
            }}
          />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-black text-surface-900 dark:text-surface-100 leading-none mb-1">
            {user.displayName?.split(" ")[0] || "User"}
          </p>
          <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
            Pro Account
          </p>
        </div>
        <FaChevronDown className={`w-3 h-3 text-surface-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-64 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-surface-100 dark:border-surface-800">
              <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1">Signed in as</p>
              <p className="font-bold text-surface-900 dark:text-surface-100 truncate">{user.email}</p>
            </div>

            <div className="p-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all font-bold group"
                onClick={() => setOpen(false)}
              >
                <div className="p-2 bg-surface-50 dark:bg-surface-800 rounded-xl group-hover:bg-white dark:group-hover:bg-surface-700 transition-colors">
                  <FaUser className="w-4 h-4" />
                </div>
                Profile Settings
              </Link>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all font-bold group"
              >
                <div className="p-2 bg-surface-50 dark:bg-surface-800 rounded-xl group-hover:bg-white dark:group-hover:bg-surface-700 transition-colors">
                  <FaCog className="w-4 h-4" />
                </div>
                Workspace Prefs
              </button>
            </div>

            <div className="p-2 bg-surface-50 dark:bg-surface-800/50">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all font-bold group"
                onClick={handleLogout}
              >
                <div className="p-2 bg-error-100 dark:bg-error-900/30 rounded-xl group-hover:bg-white dark:group-hover:bg-error-800 transition-colors">
                  <FaSignOutAlt className="w-4 h-4" />
                </div>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
