import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  delta,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta && delta.direction !== "flat" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta.direction === "up"
                ? "text-[var(--sp-success)]"
                : "text-[var(--sp-error)]"
            )}
          >
            {delta.direction === "up" ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
