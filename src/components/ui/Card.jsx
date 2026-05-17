import React from "react";
import { motion } from "framer-motion";

const Card = ({
  children,
  className = "",
  onClick,
  hoverable = false,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverable ? { translateY: -4, shadow: "var(--shadow-lg)" } : {}}
      className={`card ${hoverable ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const CardHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-surface-200 dark:border-surface-700 ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = "" }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
