import React, { useState } from "react";
import { avatarColor, cn, initials } from "../../lib/utils";

const sizes = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-20 w-20 text-2xl",
};

const Avatar = ({ name = "", src, size = "md", className = "" }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none",
        !showImage && avatarColor(name),
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
};

export const AvatarStack = ({ names = [], max = 3, size = "sm" }) => {
  if (!names.length) return null;
  const extra = names.length - max;
  return (
    <div className="flex -space-x-1.5">
      {names.slice(0, max).map((n) => (
        <Avatar key={n} name={n} size={size} className="ring-2 ring-white dark:ring-surface-900" />
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-surface-100 font-medium text-surface-600 ring-2 ring-white dark:bg-surface-800 dark:text-surface-300 dark:ring-surface-900",
            sizes[size]
          )}
        >
          +{extra}
        </span>
      )}
    </div>
  );
};

export default Avatar;
