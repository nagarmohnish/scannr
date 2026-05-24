import { Plus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";

const COMPETITORS = [
  { name: "Acme Co", sov: 22, top3: 41, promptsWon: 9, sources: "g2.com, capterra.com, reddit.com", pinned: true },
  { name: "Beta Co", sov: 17, top3: 33, promptsWon: 6, sources: "techcrunch.com, g2.com", pinned: true },
  { name: "Gamma Inc", sov: 9, top3: 18, promptsWon: 3, sources: "linkedin.com, reddit.com", pinned: false },
];

export default function CompetitorsPage() {
  return (
    <>
      <PageHeader
        title="Competitors"
        description="Who LLMs name when buyers ask about your category — and on which prompts they beat you."
        actions={
          <Button size="sm" variant="outline">
            <Plus className="size-3.5" />
            Add competitor
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_110px_1.4fr] gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          {["Brand", "SoV", "Top-3", "Prompts won", "Authority sources"].map((c) => (
            <span
              key={c}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>

        <ul>
          {/* Subject row */}
          <li className="grid grid-cols-[1fr_90px_90px_110px_1.4fr] items-center gap-3 border-b border-border bg-[color-mix(in_srgb,var(--sp-accent)_5%,transparent)] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--sp-accent)]" />
              <span className="font-medium text-foreground">You (Acme Compost)</span>
            </div>
            <Badge variant="accent">12%</Badge>
            <span className="font-mono text-sm text-foreground">18%</span>
            <span className="font-mono text-sm text-foreground">—</span>
            <span className="truncate text-xs text-muted-foreground">
              reddit.com, g2.com
            </span>
          </li>

          {/* Competitor rows */}
          {COMPETITORS.map((c, i) => (
            <li
              key={c.name}
              className={`grid grid-cols-[1fr_90px_90px_110px_1.4fr] items-center gap-3 px-5 py-3 ${
                i < COMPETITORS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-zinc-400" />
                <span className="text-foreground">{c.name}</span>
                {c.pinned && <Badge size="sm" variant="muted">pinned</Badge>}
              </div>
              <Badge variant="muted">{c.sov}%</Badge>
              <span className="font-mono text-sm text-muted-foreground">{c.top3}%</span>
              <span className="font-mono text-sm text-muted-foreground">{c.promptsWon}</span>
              <span className="truncate text-xs text-muted-foreground">{c.sources}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6">
        <EmptyState
          icon={Users}
          title="Want to track more competitors?"
          description="After your next scan we surface the top-mentioned brands. Pin any of them to track over time."
          action={
            <Button size="sm" variant="outline">
              Run discovery scan
            </Button>
          }
        />
      </div>
    </>
  );
}
