import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-44 flex-col items-start justify-center gap-3 rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--panel-subtle)] p-6">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="max-w-lg text-sm text-[var(--text-secondary)]">{description}</p>
      {action}
    </div>
  );
}
