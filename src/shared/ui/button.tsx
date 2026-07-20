import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-strong-hover)]",
  secondary: "bg-[var(--panel-strong)] text-[var(--text-primary)] hover:bg-[var(--panel-strong-hover)]",
  ghost: "bg-transparent text-[var(--text-primary)] hover:bg-[var(--panel-subtle)]",
  danger: "bg-[#d9534f] text-white hover:bg-[#bf4b47]",
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
