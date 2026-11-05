import React, { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./config/firebase";
import AppShell from "./components/layout/AppShell";
import { LogoMark } from "./components/layout/Logo";
import Spinner from "./components/ui/Spinner";
import Toaster from "./components/ui/Toaster";
import BoardPage from "./pages/BoardPage";
import CanvasPage from "./pages/CanvasPage";
import IdeasPage from "./pages/IdeasPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

const SplashScreen = () => (
  <div className="flex h-dvh flex-col items-center justify-center gap-5">
    <LogoMark className="h-10 w-10" />
    <Spinner className="h-5 w-5 text-surface-400" />
  </div>
);

const ProtectedLayout = ({ user }) => {
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return (
    <AppShell user={user}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname.split("/")[1]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

// Remount per canvas so camera and selection state never leak between canvases.
const CanvasRoute = ({ user }) => {
  const { canvasId } = useParams();
  return <CanvasPage key={canvasId} user={user} />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setAuthLoading(false);
      }),
    []
  );

  if (authLoading) return <SplashScreen />;

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/board" replace /> : <LoginPage />} />
        <Route element={<ProtectedLayout user={user} />}>
          <Route path="/board" element={<BoardPage user={user} />} />
          <Route path="/ideas" element={<IdeasPage user={user} />} />
          <Route path="/ideas/:folderId" element={<IdeasPage user={user} />} />
          <Route path="/ideas/:folderId/:canvasId" element={<CanvasRoute user={user} />} />
          <Route path="/idea-dump" element={<Navigate to="/ideas" replace />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? "/board" : "/login"} replace />} />
      </Routes>
      <Toaster />
    </>
  );
};

export default App;
