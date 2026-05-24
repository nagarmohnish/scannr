import Link from "next/link";
import { ArrowRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

// ─── Stub data — replace with real workspace queries in Phase 1 ──────────────

const RECENT_SCANS = [
  { id: "1", domain: "sharktankblog.com", score: 7, ranAt: "2 days ago" },
  { id: "2", domain: "acmecompost.com", score: 34, ranAt: "5 days ago" },
  { id: "3", domain: "vercel.com", score: 62, ranAt: "1 week ago" },
];

const TOP_OPPORTUNITIES = [
  {
    publication: "reddit.com",
    reason: "Cited 11× across discovery prompts. You have no presence.",
    difficulty: "Low",
  },
  {
    publication: "g2.com",
    reason: "Cited 7× in commercial comparisons. Profile incomplete.",
    difficulty: "Medium",
  },
  {
    publication: "techcrunch.com",
    reason: "Competitor A surfaces here. Mid-tier press play.",
    difficulty: "High",
  },
];

const TOP_ALERTS = [
  {
    type: "Competitor surge",
    text: "Competitor A's appearance rate up 18% on Gemini this week.",
    severity: "danger" as const,
  },
  {
    type: "Sentiment shift",
    text: "ChatGPT now describes you as 'unverified' on 2 prompts.",
    severity: "danger" as const,
  },
];

// ────────────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="How buyers see your brand across ChatGPT, Claude, Gemini, and Perplexity."
        actions={
          <Link href="/">
            <Button size="sm">
              <Plus className="size-3.5" />
              New scan
            </Button>
          </Link>
        }
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="AI Visibility"
          value="34%"
          delta={{ value: "+4%", direction: "up" }}
          hint="vs. last week"
        />
        <StatCard
          label="Share of Voice"
          value="12%"
          delta={{ value: "−2%", direction: "down" }}
          hint="vs. 3 tracked competitors"
        />
        <StatCard
          label="Top-3 Rate"
          value="18%"
          hint="of prompts where you appear first 3"
        />
        <StatCard
          label="Stability"
          value="2.4 / 3"
          hint="runs you appeared in"
        />
      </div>

      {/* Trend + actions row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Trend card */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Appearance rate · 30 days</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your brand vs. 3 tracked competitors
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-[var(--sp-accent)]" /> You
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-zinc-400" /> Comp A
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-zinc-300" /> Comp B
              </span>
            </div>
          </div>
          <div className="h-56 px-5 py-4">
            <SparkLineMock />
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <p className="text-sm font-semibold text-foreground">Next actions</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Top 3 publications to target
            </p>
          </div>
          <ul className="divide-y divide-border">
            {TOP_OPPORTUNITIES.map((opp) => (
              <li key={opp.publication} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-foreground">
                      {opp.publication}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {opp.reason}
                    </p>
                  </div>
                  <Badge size="sm" variant="muted">
                    {opp.difficulty}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/publications"
            className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            See all opportunities
            <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      </div>

      {/* Alerts + Recent scans */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <p className="text-sm font-semibold text-foreground">Active alerts</p>
            <Link
              href="/dashboard/alerts"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          {TOP_ALERTS.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TrendingUp}
                title="No alerts"
                description="You'll see drift alerts here when your appearance rate or sentiment shifts."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {TOP_ALERTS.map((a, i) => (
                <li key={i} className="flex items-start gap-3 p-4">
                  <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--sp-error)_12%,transparent)] text-[var(--sp-error)]">
                    <TrendingDown className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{a.type}</p>
                    <p className="text-xs text-muted-foreground">{a.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border p-5">
            <p className="text-sm font-semibold text-foreground">Recent scans</p>
            <Link
              href="/dashboard/scans"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {RECENT_SCANS.map((scan) => (
              <li
                key={scan.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-foreground">
                    {scan.domain}
                  </p>
                  <p className="text-xs text-muted-foreground">{scan.ranAt}</p>
                </div>
                <ScorePill score={scan.score} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — workspace persistence ships in Phase 1.
      </p>
    </>
  );
}

function ScorePill({ score }: { score: number }) {
  const variant = score >= 60 ? "success" : score >= 30 ? "accent" : "danger";
  return (
    <Badge variant={variant}>
      <span className="font-mono">{score}%</span>
    </Badge>
  );
}

function SparkLineMock() {
  // Three SVG sparklines so the dashboard renders something believable
  // until the Phase 1 persistence layer wires up real trend data.
  const pathYou =
    "M 0 90 L 40 88 L 80 82 L 120 78 L 160 72 L 200 70 L 240 65 L 280 60 L 320 55 L 360 50 L 400 48";
  const pathA =
    "M 0 80 L 40 70 L 80 75 L 120 60 L 160 55 L 200 50 L 240 40 L 280 35 L 320 30 L 360 25 L 400 20";
  const pathB =
    "M 0 110 L 40 105 L 80 100 L 120 100 L 160 95 L 200 90 L 240 88 L 280 82 L 320 80 L 360 78 L 400 75";

  return (
    <svg viewBox="0 0 400 130" className="h-full w-full">
      {/* gridlines */}
      {[0, 32, 64, 96, 128].map((y) => (
        <line
          key={y}
          x1={0}
          x2={400}
          y1={y}
          y2={y}
          stroke="currentColor"
          className="text-border"
          strokeWidth={1}
        />
      ))}
      <path d={pathB} stroke="#d4d4d4" strokeWidth={1.5} fill="none" />
      <path d={pathA} stroke="#a3a3a3" strokeWidth={1.5} fill="none" />
      <path d={pathYou} stroke="var(--sp-accent)" strokeWidth={2} fill="none" />
    </svg>
  );
}
