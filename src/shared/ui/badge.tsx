import type { HTMLAttributes } from "react";

import { cn } from "./cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-[var(--panel-strong)] text-[var(--text-secondary)]",
  success: "bg-[#ddf9ef] text-[#0f7a54] dark:bg-[#15392e] dark:text-[#6ce0b6]",
  warning: "bg-[#fff3d9] text-[#995b00] dark:bg-[#3b2b13] dark:text-[#ffcc73]",
  danger: "bg-[#ffe2de] text-[#9a2d21] dark:bg-[#3d1f1f] dark:text-[#ff9d95]",
  accent: "bg-[#dff7f4] text-[#0b8f82] dark:bg-[#153733] dark:text-[#6deadd]",
};

export function Badge({
  className,
  children,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
