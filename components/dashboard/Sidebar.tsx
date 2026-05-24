"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NAV_GROUPS } from "./nav-config";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex h-full w-60 flex-col border-r border-border bg-sidebar",
        className
      )}
      aria-label="Primary"
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link
          href="/dashboard"
          className="font-bold tracking-tight text-foreground"
        >
          sparrwo
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={`${group.label}-${gi}`} className="mb-5 last:mb-0">
            {group.label && (
              <p className="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-[var(--sp-accent)]" : ""
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge size="sm" variant="muted">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <p className="font-mono text-[10px] text-muted-foreground">
          v0.1.0 · phase 2 preview
        </p>
      </div>
    </nav>
  );
}
