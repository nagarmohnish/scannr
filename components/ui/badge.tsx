import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        accent:
          "border-[color-mix(in_srgb,var(--sp-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--sp-accent)_10%,transparent)] text-[var(--sp-accent)]",
        success:
          "border-[color-mix(in_srgb,var(--sp-success)_30%,transparent)] bg-[color-mix(in_srgb,var(--sp-success)_10%,transparent)] text-[var(--sp-success)]",
        danger:
          "border-[color-mix(in_srgb,var(--sp-error)_30%,transparent)] bg-[color-mix(in_srgb,var(--sp-error)_10%,transparent)] text-[var(--sp-error)]",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
      size: {
        default: "h-5 text-[11px]",
        sm: "h-4 px-1.5 text-[10px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
