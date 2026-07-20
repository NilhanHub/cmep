import { initials } from "@/shared/domain/format";
import { cn } from "./cn";

export function Avatar({
  name,
  tone,
  className,
}: {
  name: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md text-sm font-semibold text-white",
        className,
      )}
      style={{ backgroundColor: tone ?? "#334155" }}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
