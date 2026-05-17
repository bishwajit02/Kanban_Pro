import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGoogle,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/board");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/board");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md"
      >
        <Card className="p-8 md:p-10 shadow-2xl border-surface-200 dark:border-surface-800 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30"
            >
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z" />
              </svg>
            </motion.div>
            <h1 className="text-3xl font-black text-surface-900 dark:text-surface-100 mb-2">
              KanbanPro
            </h1>
            <p className="text-surface-500 dark:text-surface-400 font-medium">
              {isSignup
                ? "Join our community and start building"
                : "Welcome back! Please sign in to continue"}
            </p>
          </div>

          {/* Google Sign In */}
          <Button
            variant="secondary"
            className="w-full py-4 rounded-2xl font-bold border-2"
            onClick={handleGoogle}
            isLoading={loading}
            leftIcon={FaGoogle}
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
            <span className="text-xs font-black text-surface-400 uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-800" />
          </div>

          {/* Email Form */}
          <form className="space-y-5" onSubmit={handleEmailAuth}>
            <Input
              type="email"
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={FaEnvelope}
              className="py-4 rounded-2xl"
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                leftIcon={FaLock}
                className="py-4 rounded-2xl"
              />
              <button
                type="button"
                className="absolute bottom-4 right-4 text-surface-400 hover:text-primary-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="w-5 h-5" />
                ) : (
                  <FaEye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full py-4 rounded-2xl font-black shadow-lg shadow-primary-500/20 mt-4"
              isLoading={loading}
            >
              {isSignup ? "Create Account" : "Sign In to Workspace"}
            </Button>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-2xl"
              >
                <p className="text-error-600 dark:text-error-400 text-sm font-semibold text-center leading-relaxed">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Sign In/Sign Up */}
          <div className="text-center mt-10">
            <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all underline-offset-4"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                disabled={loading}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </Card>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 mt-10">
          <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors uppercase tracking-widest">
            Privacy
          </a>
          <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors uppercase tracking-widest">
            Terms
          </a>
          <a href="#" className="text-xs font-bold text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors uppercase tracking-widest">
            Help
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
