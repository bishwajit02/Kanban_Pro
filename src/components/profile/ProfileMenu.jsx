import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { FiChevronUp, FiLogOut, FiMonitor, FiMoon, FiSun, FiUser } from "react-icons/fi";
import { auth } from "../../config/firebase";
import { useTheme } from "../../lib/theme";
import { toast } from "../../lib/toast";
import { cn } from "../../lib/utils";
import Avatar from "../ui/Avatar";
import Menu, { MenuItem, MenuSeparator } from "../ui/Menu";

const themeOptions = [
  { value: "light", icon: FiSun, label: "Light" },
  { value: "dark", icon: FiMoon, label: "Dark" },
  { value: "system", icon: FiMonitor, label: "System" },
];

const ProfileMenu = ({ user, onNavigate }) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const name = user.displayName || user.email;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      toast.error("Couldn't sign out. Please try again.");
    }
  };

  return (
    <Menu
      side="top"
      align="left"
      className="w-full min-w-60"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors",
            open ? "bg-surface-200/70 dark:bg-surface-800" : "hover:bg-surface-200/50 dark:hover:bg-surface-800/60"
          )}
        >
          <Avatar name={name} src={user.photoURL} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
              {user.displayName || "Your account"}
            </p>
            <p className="truncate text-xs text-surface-500">{user.email}</p>
          </div>
          <FiChevronUp className={cn("h-3.5 w-3.5 text-surface-400 transition-transform", !open && "rotate-180")} />
        </button>
      )}
    >
      <>
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="text-xs text-surface-500">Signed in as</p>
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">{user.email}</p>
          </div>
          <MenuSeparator />
          <MenuItem
            icon={FiUser}
            onClick={() => {
              onNavigate?.();
              navigate("/profile");
            }}
          >
            Account settings
          </MenuItem>
          <div className="px-2.5 py-1.5">
            <p className="mb-1.5 text-xs text-surface-500">Theme</p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-100 p-0.5 dark:bg-surface-800">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={theme === opt.value}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md py-1 text-xs transition-colors",
                    theme === opt.value
                      ? "bg-white font-medium text-surface-900 shadow-xs dark:bg-surface-700 dark:text-surface-50"
                      : "text-surface-500 hover:text-surface-800 dark:hover:text-surface-200"
                  )}
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <MenuSeparator />
          <MenuItem icon={FiLogOut} danger onClick={handleLogout}>
            Sign out
          </MenuItem>
      </>
    </Menu>
  );
};

export default ProfileMenu;
