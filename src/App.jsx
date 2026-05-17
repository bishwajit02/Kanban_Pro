import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import BoardPage from "./pages/BoardPage";
import ProfilePage from "./pages/ProfilePage";
import IdeaDumpPage from "./pages/IdeaDumpPage";
import ProfileMenu from "./components/ProfileMenu";
import { AnimatePresence, motion } from "framer-motion";
import LoginPage from "./pages/LoginPage";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTrello, FaLightbulb, FaUser, FaBars } from "react-icons/fa";

// App Settings Modal

const Navigation = ({ currentPath }) => {
  const navItems = [
    { path: "/board", label: "Board", icon: FaTrello },
    { path: "/idea-dump", label: "Ideas", icon: FaLightbulb },
    { path: "/profile", label: "Profile", icon: FaUser },
  ];

  return (
    <nav className="hidden md:flex items-center gap-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center gap-4 ${
              currentPath === item.path
                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm border border-primary-200 dark:border-primary-700"
                : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800"
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-surface">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-surface-700 dark:text-surface-300">
              Loading KanbanPro
            </div>
            <div className="text-surface-500 dark:text-surface-400">
              Setting up your workspace...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-surface flex flex-col">
      {/* Top Bar */}
      {user && (
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-surface-900/95 border-b border-surface-200 dark:border-surface-700 shadow-sm"
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-between h-20">
              {/* Left side - Logo and Navigation */}
              <div className="flex items-center gap-12">
                {/* Logo */}
                <Link to="/board" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" />
                    </svg>
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-bold text-xl bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                      KanbanPro
                    </div>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <Navigation currentPath={location.pathname} />
              </div>

              {/* Right side - Profile Menu */}
              <div className="flex items-center">
                {/* Profile Menu */}
                <ProfileMenu user={user} />

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden btn btn-ghost btn-sm p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 ml-3"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  title="Menu"
                >
                  <FaBars className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden border-t border-surface-200 dark:border-surface-700 py-6"
                >
                  <div className="space-y-3">
                    {[
                      { path: "/board", label: "Board", icon: FaTrello },
                      { path: "/idea-dump", label: "Ideas", icon: FaLightbulb },
                      { path: "/profile", label: "Profile", icon: FaUser },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-4 px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                            location.pathname === item.path
                              ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                              : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.header>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col"
        >
          <Routes location={location}>
            <Route
              path="/login"
              element={user ? <Navigate to="/board" replace /> : <LoginPage />}
            />
            <Route
              path="/"
              element={<Navigate to={user ? "/board" : "/login"} replace />}
            />
            <Route
              path="/board"
              element={
                user ? (
                  <BoardPage user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                user ? (
                  <ProfilePage user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/idea-dump"
              element={
                user ? (
                  <IdeaDumpPage user={user} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default App;
