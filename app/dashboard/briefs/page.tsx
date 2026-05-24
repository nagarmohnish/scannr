import { Download, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface Brief {
  id: string;
  title: string;
  status: "draft" | "published" | "measured";
  publication: string;
  targetQueries: number;
  demand: number;
  createdAt: string;
}

const BRIEFS: Brief[] = [
  {
    id: "1",
    title: "Compostable packaging buyers' guide for Indian restaurants",
    status: "draft",
    publication: "g2.com",
    targetQueries: 6,
    demand: 9800,
    createdAt: "today",
  },
  {
    id: "2",
    title: "How to switch your kitchen to compostable cutlery — 30-day plan",
    status: "published",
    publication: "blog · own",
    targetQueries: 4,
    demand: 5400,
    createdAt: "3 days ago",
  },
];

const STATUS_TONE: Record<Brief["status"], "muted" | "accent" | "success"> = {
  draft: "muted",
  published: "accent",
  measured: "success",
};

export default function BriefsPage() {
  return (
    <>
      <PageHeader
        title="Briefs"
        description="Publish-ready content briefs targeting the gaps your scan surfaced."
        actions={
          <Button size="sm">
            <Plus className="size-3.5" />
            New brief
          </Button>
        }
      />

      {BRIEFS.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No briefs yet"
          description="Run a scan, then we'll generate a brief for each visibility gap with target queries, sources, and a scoring rubric."
          action={<Button size="sm">Generate from latest scan</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {BRIEFS.map((b) => (
            <Card key={b.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge variant={STATUS_TONE[b.status]}>{b.status}</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {b.createdAt}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
                {b.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Target publication · <span className="font-mono">{b.publication}</span>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Target queries
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">
                    {b.targetQueries}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Demand surface
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">
                    {b.demand.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Open
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="size-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — brief generator ships in Phase 6.
      </p>
    </>
  );
}
