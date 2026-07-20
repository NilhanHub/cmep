import type { SelectHTMLAttributes } from "react";

import { cn } from "./cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--panel)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-strong)] focus:ring-2 focus:ring-[var(--accent-soft)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
