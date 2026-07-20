import type { PropsWithChildren, ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: ReactNode }>) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--text-primary)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}
