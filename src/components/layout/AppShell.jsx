import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiColumns, FiMenu, FiSettings, FiX, FiZap } from "react-icons/fi";
import { cn } from "../../lib/utils";
import ProfileMenu from "../profile/ProfileMenu";
import Logo from "./Logo";

const navItems = [
  { to: "/board", label: "Board", icon: FiColumns },
  { to: "/ideas", label: "Ideas", icon: FiZap },
  { to: "/profile", label: "Settings", icon: FiSettings },
];

const SidebarContent = ({ user, onNavigate }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-14 items-center px-4">
      <Logo />
    </div>

    <nav className="flex-1 space-y-0.5 px-3 py-2">
      <p className="px-2 pb-1.5 text-[11px] font-medium tracking-wide text-surface-400 uppercase">Workspace</p>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-white font-medium text-surface-900 shadow-xs ring-1 ring-surface-200 dark:bg-surface-800 dark:text-surface-50 dark:ring-surface-700"
                : "text-surface-600 hover:bg-surface-200/50 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800/60 dark:hover:text-surface-100"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-600 dark:text-primary-400" : "opacity-70")} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    <div className="border-t border-surface-200 p-3 dark:border-surface-800">
      <ProfileMenu user={user} onNavigate={onNavigate} />
    </div>
  </div>
);

const AppShell = ({ user, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-surface-200 bg-surface-100/60 lg:block dark:border-surface-800 dark:bg-surface-900/40">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-950/40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 360 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-surface-200 bg-surface-50 dark:border-surface-800 dark:bg-surface-900"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 rounded-md p-1.5 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800"
              >
                <FiX className="h-4 w-4" />
              </button>
              <SidebarContent user={user} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-200 bg-white/80 px-4 backdrop-blur lg:hidden dark:border-surface-800 dark:bg-surface-950/80">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="-ml-1.5 rounded-md p-1.5 text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <Logo />
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
