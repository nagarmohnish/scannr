import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface Pub {
  domain: string;
  tier: "press" | "trade" | "community" | "reference";
  citedCount: number;
  hasPresence: boolean;
  authority: number;
  difficulty: "Low" | "Medium" | "High";
  opportunityScore: number;
}

const PUBS: Pub[] = [
  { domain: "reddit.com",       tier: "community", citedCount: 11, hasPresence: false, authority: 92, difficulty: "Low",    opportunityScore: 91 },
  { domain: "g2.com",           tier: "trade",     citedCount: 8,  hasPresence: false, authority: 88, difficulty: "Medium", opportunityScore: 78 },
  { domain: "wikipedia.org",    tier: "reference", citedCount: 6,  hasPresence: false, authority: 99, difficulty: "High",   opportunityScore: 64 },
  { domain: "techcrunch.com",   tier: "press",     citedCount: 5,  hasPresence: false, authority: 94, difficulty: "High",   opportunityScore: 58 },
  { domain: "capterra.com",     tier: "trade",     citedCount: 5,  hasPresence: true,  authority: 81, difficulty: "Low",    opportunityScore: 42 },
  { domain: "quora.com",        tier: "community", citedCount: 4,  hasPresence: false, authority: 86, difficulty: "Low",    opportunityScore: 55 },
];

const TIER_LABEL: Record<Pub["tier"], string> = {
  press: "Press",
  trade: "Trade",
  community: "Community",
  reference: "Reference",
};

export default function PublicationsPage() {
  return (
    <>
      <PageHeader
        title="Publications"
        description="LLMs cite these 28 sources in your category. You have presence on 1."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">All tiers</Badge>
        <Badge variant="muted">Press</Badge>
        <Badge variant="muted">Trade</Badge>
        <Badge variant="muted">Community</Badge>
        <Badge variant="muted">Reference</Badge>
        <div className="ml-auto text-xs text-muted-foreground">
          Sorted by opportunity score
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PUBS.map((p) => (
          <Card key={p.domain} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
                  {p.domain}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {TIER_LABEL[p.tier]} · DR {p.authority}
                </p>
              </div>
              <Badge variant={p.hasPresence ? "success" : "muted"}>
                {p.hasPresence ? "Present" : "No presence"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Cited
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground">
                  {p.citedCount}×
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Difficulty
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {p.difficulty}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Score
                </p>
                <p className="mt-0.5 text-base font-semibold text-[var(--sp-accent)]">
                  {p.opportunityScore}
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Newspaper className="size-3.5" /> View opportunity
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — citation graph + DataForSEO authority enrichment ships in Phase 4.
      </p>
    </>
  );
}
