import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";

const SCANS = [
  { id: "1", domain: "sharktankblog.com", score: 7, engines: 3, ranAt: "2 days ago", trigger: "manual" },
  { id: "2", domain: "acmecompost.com", score: 34, engines: 4, ranAt: "5 days ago", trigger: "manual" },
  { id: "3", domain: "vercel.com", score: 62, engines: 4, ranAt: "1 week ago", trigger: "scheduled" },
];

function scoreColor(score: number) {
  if (score >= 60) return "success" as const;
  if (score >= 30) return "accent" as const;
  return "danger" as const;
}

export default function ScansPage() {
  return (
    <>
      <PageHeader
        title="Scans"
        description="Every visibility scan you've run against ChatGPT, Claude, Gemini, and Perplexity."
        actions={
          <Link href="/">
            <Button size="sm">
              <Plus className="size-3.5" />
              New scan
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_90px_90px_130px_80px] gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          {["Domain", "Score", "Engines", "Trigger", "Last run", ""].map((c) => (
            <span
              key={c}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>

        {/* Rows */}
        <ul>
          {SCANS.map((s, i) => (
            <li
              key={s.id}
              className={`grid grid-cols-[1fr_120px_90px_90px_130px_80px] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                i < SCANS.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-sm text-foreground">
                  {s.domain}
                </span>
              </div>
              <Badge variant={scoreColor(s.score)}>
                <span className="font-mono">{s.score}%</span>
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">{s.engines} / 4</span>
              <Badge size="sm" variant="muted">
                {s.trigger}
              </Badge>
              <span className="text-xs text-muted-foreground">{s.ranAt}</span>
              <Link
                href={`/dashboard/scans/${s.id}`}
                className="text-right text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                View →
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 font-mono text-[10px] text-muted-foreground">
        Stub data — scan history lands in Phase 1 once Supabase persistence is wired.
      </p>
    </>
  );
}
