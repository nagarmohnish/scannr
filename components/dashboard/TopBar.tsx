"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_WORKSPACE = "Acme Compost"; // stub — replace when workspaces table is wired up

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Workspace switcher */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-[var(--sp-accent)] font-mono text-xs font-semibold text-white">
          {DEMO_WORKSPACE.slice(0, 1)}
        </span>
        {DEMO_WORKSPACE}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button size="sm" variant="default">
            <Plus className="size-3.5" />
            New scan
          </Button>
        </Link>

        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          aria-label="User menu"
        >
          R
        </button>
      </div>
    </header>
  );
}
