import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { FiCheck, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { auth, googleProvider } from "../config/firebase";
import { toast } from "../lib/toast";
import { authErrorMessage } from "../lib/utils";
import { LogoMark } from "../components/layout/Logo";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const features = [
  "Drag-and-drop boards with custom columns",
  "Priorities, due dates, assignees and attachments",
  "An Idea Dump for notes, links and inspiration",
];

/** Decorative product preview for the brand panel. */
const BoardPreview = () => {
  const columns = [
    { title: "To Do", dot: "bg-white/60", cards: [["w-4/5", "bg-rose-300"], ["w-3/5", "bg-amber-300"]] },
    { title: "In Progress", dot: "bg-sky-300", cards: [["w-2/3", "bg-amber-300"], ["w-4/5", "bg-emerald-300"], ["w-1/2", "bg-rose-300"]] },
    { title: "Done", dot: "bg-emerald-300", cards: [["w-3/4", "bg-emerald-300"]] },
  ];
  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-sm">
      {columns.map((col) => (
        <div key={col.title} className="space-y-2 rounded-xl bg-white/10 p-2">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-white/80">
            <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
            {col.title}
          </div>
          {col.cards.map(([w, tag], i) => (
            <div key={i} className="space-y-2 rounded-lg bg-white/90 p-2.5 shadow-sm">
              <div className={`h-1.5 rounded-full bg-surface-300 ${w}`} />
              <div className="h-1.5 w-2/5 rounded-full bg-surface-200" />
              <div className="flex items-center justify-between pt-0.5">
                <span className={`h-2 w-7 rounded-full ${tag}`} />
                <span className="h-3.5 w-3.5 rounded-full bg-primary-300" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const LoginPage = () => {
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // "google" | "email" | null

  const switchMode = (next) => {
    setMode(next);
    setError("");
  };

  const handleGoogle = async () => {
    setError("");
    setPending("google");
    try {
      await signInWithPopup(auth, googleProvider);
      // App redirects to /board once auth state updates.
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(authErrorMessage(err));
      }
    } finally {
      setPending(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPending("email");
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        toast.success("Password reset email sent. Check your inbox.");
        switchMode("signin");
      } else if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setPending(null);
    }
  };

  const copy = {
    signin: ["Welcome back", "Sign in to your workspace to continue."],
    signup: ["Create your account", "Start organising your work in under a minute."],
    reset: ["Reset your password", "We'll email you a link to choose a new one."],
  }[mode];

  return (
    <div className="flex min-h-dvh bg-white dark:bg-surface-950">
      {/* Form side */}
      <div className="flex flex-1 flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight">
            Kanban<span className="text-primary-600 dark:text-primary-400">Pro</span>
          </span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-surface-900 dark:text-surface-50">{copy[0]}</h1>
          <p className="mt-1.5 text-sm text-surface-500 dark:text-surface-400">{copy[1]}</p>

          {mode !== "reset" && (
            <>
              <Button
                variant="secondary"
                size="lg"
                className="mt-8 w-full"
                onClick={handleGoogle}
                isLoading={pending === "google"}
                disabled={!!pending}
                leftIcon={FcGoogle}
              >
                Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-3 text-xs text-surface-400">
                <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800" />
                or continue with email
                <div className="h-px flex-1 bg-surface-200 dark:bg-surface-800" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className={mode === "reset" ? "mt-8 space-y-4" : "space-y-4"}>
            {mode === "signup" && (
              <Input
                label="Full name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={FiUser}
                className="h-10"
              />
            )}
            <Input
              type="email"
              label="Work email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={FiMail}
              className="h-10"
            />
            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="field-label">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="mb-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  leftIcon={FiLock}
                  className="h-10"
                  rightElement={
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      className="rounded-md p-1.5 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                    >
                      {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  }
                />
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-error-100 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
              >
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={pending === "email"} disabled={!!pending}>
              {{ signin: "Sign in", signup: "Create account", reset: "Send reset link" }[mode]}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-surface-500">
            {mode === "signin" ? "New to KanbanPro? " : mode === "signup" ? "Already have an account? " : "Remembered it? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-surface-400 lg:text-left">© {new Date().getFullYear()} KanbanPro</p>
      </div>

      {/* Brand side */}
      <div className="relative hidden flex-1 overflow-hidden bg-linear-to-br from-primary-600 via-primary-700 to-primary-950 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative max-w-lg">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Plan the work. Ship the work. Keep every idea.
          </h2>
          <ul className="mt-6 space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-primary-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <FiCheck className="h-3 w-3 text-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <BoardPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
