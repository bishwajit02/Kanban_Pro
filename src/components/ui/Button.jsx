import React from "react";
import { motion } from "framer-motion";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    error: "bg-error-500 text-white hover:bg-error-600 shadow-sm",
    success: "bg-success-500 text-white hover:bg-success-600 shadow-sm",
  };

  const sizes = {
    sm: "btn-sm",
    md: "", // default .btn is md
    lg: "btn-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`btn ${variants[variant]} ${sizes[size]} ${className} ${
        isLoading ? "opacity-70 cursor-not-allowed" : ""
      }`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : (
        LeftIcon && <LeftIcon className="w-5 h-5" />
      )}
      {children}
      {!isLoading && RightIcon && <RightIcon className="w-5 h-5" />}
    </motion.button>
  );
};

export default Button;
