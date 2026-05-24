import { Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";

const KEYWORDS = [
  { kw: "compostable packaging suppliers india", google: 1900, bing: 320, trend: "rising",    yourRank: null, topRank: 3,  aio: true,  prompts: 4 },
  { kw: "best compostable food containers",      google: 5400, bing: 880, trend: "stable",    yourRank: 18,   topRank: 1,  aio: true,  prompts: 6 },
  { kw: "bulk compostable bags wholesale",       google: 720,  bing: 110, trend: "rising",    yourRank: 7,    topRank: 1,  aio: false, prompts: 3 },
  { kw: "cpcb certified packaging",              google: 480,  bing: 60,  trend: "declining", yourRank: null, topRank: 12, aio: false, prompts: 2 },
  { kw: "biodegradable cutlery for restaurants", google: 3600, bing: 510, trend: "stable",    yourRank: 24,   topRank: 2,  aio: true,  prompts: 5 },
  { kw: "compostable vs biodegradable",          google: 12100,bing: 1900,trend: "rising",    yourRank: null, topRank: 1,  aio: true,  prompts: 4 },
];

function TrendIcon({ direction }: { direction: string }) {
  const cls =
    direction === "rising"
      ? "text-[var(--sp-success)]"
      : direction === "declining"
        ? "text-[var(--sp-error)]"
        : "text-muted-foreground";
  return <span className={`font-mono text-[10px] uppercase ${cls}`}>{direction}</span>;
}

export default function KeywordsPage() {
  return (
    <>
      <PageHeader
        title="Keywords"
        description="The Google + Bing demand surface underlying your AI visibility prompts."
        actions={
          <Button size="sm" variant="outline">
            <Filter className="size-3.5" />
            Filters
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.6fr_80px_80px_100px_80px_80px_80px_80px] gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          {["Query", "Google", "Bing", "Trend", "Your", "Top", "AIO", "Prompts"].map(
            (c) => (
              <span
                key={c}
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {c}
              </span>
            )
          )}
        </div>

        <ul>
          {KEYWORDS.map((k, i) => (
            <li
              key={k.kw}
              className={`grid grid-cols-[1.6fr_80px_80px_100px_80px_80px_80px_80px] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                i < KEYWORDS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="truncate text-sm text-foreground">{k.kw}</span>
              <span className="font-mono text-xs text-foreground">{k.google.toLocaleString()}</span>
              <span className="font-mono text-xs text-muted-foreground">{k.bing.toLocaleString()}</span>
              <TrendIcon direction={k.trend} />
              <span className="font-mono text-xs text-foreground">
                {k.yourRank ?? "—"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{k.topRank}</span>
              {k.aio ? (
                <Badge size="sm" variant="accent">AIO</Badge>
              ) : (
                <span className="font-mono text-xs text-muted-foreground">—</span>
              )}
              <span className="font-mono text-xs text-muted-foreground">{k.prompts}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 font-mono text-[10px] text-muted-foreground">
        Stub data — DataForSEO integration scaffolds in Phase 1, full universe builds in Phase 5.
      </p>
    </>
  );
}
