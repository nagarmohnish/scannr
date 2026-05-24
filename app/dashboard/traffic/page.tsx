import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  ExternalLink,
  Globe,
  Megaphone,
  MousePointerClick,
  Plug,
  Search,
  ShoppingCart,
  Sparkles,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

// ─── Stub data ────────────────────────────────────────────────────────────────

const SOURCE_GROUPS = [
  {
    label: "AI assistants",
    icon: Bot,
    accent: true,
    rows: [
      { source: "chatgpt.com / referral",      sessions: 1842, convRate: 4.1, avgDur: "3:12", bounce: 38 },
      { source: "perplexity.ai / referral",    sessions: 1217, convRate: 3.6, avgDur: "2:48", bounce: 41 },
      { source: "gemini.google.com / referral", sessions: 612,  convRate: 2.4, avgDur: "2:01", bounce: 53 },
      { source: "claude.ai / referral",        sessions: 287,  convRate: 5.2, avgDur: "3:55", bounce: 32 },
      { source: "copilot.microsoft.com / ref.", sessions: 96,   convRate: 1.9, avgDur: "1:44", bounce: 61 },
    ],
  },
  {
    label: "Organic search",
    icon: Search,
    rows: [
      { source: "google / organic", sessions: 14_812, convRate: 2.8, avgDur: "2:34", bounce: 49 },
      { source: "bing / organic",   sessions: 1_206,  convRate: 2.1, avgDur: "2:01", bounce: 58 },
      { source: "duckduckgo / organic", sessions: 412, convRate: 1.7, avgDur: "1:48", bounce: 64 },
    ],
  },
  {
    label: "Social",
    icon: Megaphone,
    rows: [
      { source: "linkedin / referral", sessions: 2_104, convRate: 3.4, avgDur: "2:51", bounce: 44 },
      { source: "reddit / referral",   sessions: 1_887, convRate: 1.2, avgDur: "1:32", bounce: 71 },
      { source: "youtube / referral",  sessions: 612,   convRate: 2.0, avgDur: "2:18", bounce: 52 },
    ],
  },
  {
    label: "Direct + email",
    icon: MousePointerClick,
    rows: [
      { source: "(direct) / (none)",  sessions: 6_412, convRate: 4.2, avgDur: "3:01", bounce: 36 },
      { source: "newsletter / email", sessions: 1_847, convRate: 6.8, avgDur: "4:12", bounce: 22 },
    ],
  },
];

const INTENT_FUNNEL = [
  { stage: "Informational", sessions: 12_481, share: 41, convRate: 0.9, color: "#a3a3a3" },
  { stage: "Discovery",     sessions: 8_204,  share: 27, convRate: 2.4, color: "var(--sp-accent)" },
  { stage: "Commercial",    sessions: 6_119,  share: 20, convRate: 4.8, color: "#10b981" },
  { stage: "Transactional", sessions: 3_440,  share: 12, convRate: 9.1, color: "var(--sp-success)" },
];

const RECOMMENDATIONS = [
  {
    bucket: "Content",
    icon: Sparkles,
    priority: "high" as const,
    title: "8 high-intent commercial prompts have no landing page",
    detail:
      "Buyers asking 'best compostable packaging for cloud kitchens' get answers naming you, but no dedicated page to convert them. Build comparison hub at /alternatives.",
    impact: "+1,800 sessions/mo · ~$24k ARR",
  },
  {
    bucket: "PR / Citations",
    icon: Megaphone,
    priority: "high" as const,
    title: "g2.com cited 8× but your G2 profile is incomplete",
    detail:
      "Reviewers default to listed competitors. Add 5 case studies + claim featured snippet variant.",
    impact: "+12% AI Top-3 rate on discovery",
  },
  {
    bucket: "Tech / Performance",
    icon: Wifi,
    priority: "medium" as const,
    title: "Core Web Vitals failing on 3 highest-traffic pages",
    detail:
      "LCP > 4.0s on /products, /pricing, /case-studies. Mobile bounce 71%. Lazy-load hero images, defer ad pixel, optimize Cloudflare cache.",
    impact: "−25% bounce on mobile · est. +9% conversions",
  },
  {
    bucket: "UI / UX",
    icon: Smartphone,
    priority: "medium" as const,
    title: "AI-referred users hit a 404 chain",
    detail:
      "Old recap URLs (cited by Gemini for 6 prompts) redirect through 2 hops. Direct 301s recover ~5% of lost sessions.",
    impact: "+300 sessions/mo",
  },
  {
    bucket: "Geo / Local SEO",
    icon: Globe,
    priority: "low" as const,
    title: "Bangalore + Mumbai pages lack schema",
    detail:
      "Local Business + Service schema absent. AI engines can't ground location queries. Affects 4 transactional prompts.",
    impact: "+geo presence on India queries",
  },
];

const TOP_LANDING = [
  { url: "/blog/compostable-vs-biodegradable", sessions: 4_109, aiShare: 38, convRate: 3.2 },
  { url: "/products/cutlery",                  sessions: 2_851, aiShare: 22, convRate: 5.8 },
  { url: "/pricing",                            sessions: 1_984, aiShare: 18, convRate: 8.1 },
  { url: "/alternatives",                       sessions: 1_412, aiShare: 47, convRate: 6.4 },
];

const PRIORITY_TONE: Record<"high" | "medium" | "low", "danger" | "accent" | "muted"> = {
  high: "danger",
  medium: "accent",
  low: "muted",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrafficPage() {
  const aiSessions = SOURCE_GROUPS[0].rows.reduce((s, r) => s + r.sessions, 0);
  const totalSessions = SOURCE_GROUPS.reduce(
    (s, g) => s + g.rows.reduce((ss, r) => ss + r.sessions, 0),
    0
  );
  const aiShare = Math.round((aiSessions / totalSessions) * 100);

  return (
    <>
      <PageHeader
        title="Traffic"
        description="Where sessions actually come from, what users intend, and what to fix to grow them."
        actions={
          <Button size="sm" variant="outline">
            <Plug className="size-3.5" />
            GA4 connected
          </Button>
        }
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sessions · 30d"
          value={totalSessions.toLocaleString()}
          delta={{ value: "+8%", direction: "up" }}
          hint="vs. last 30d"
        />
        <StatCard
          label="AI-referred"
          value={aiSessions.toLocaleString()}
          delta={{ value: "+34%", direction: "up" }}
          hint={`${aiShare}% of total`}
        />
        <StatCard
          label="Conversion rate"
          value="3.4%"
          delta={{ value: "−0.2%", direction: "down" }}
          hint="all sources"
        />
        <StatCard
          label="Est. revenue · 30d"
          value="$184k"
          delta={{ value: "+11%", direction: "up" }}
          hint="from GA4 events"
        />
      </div>

      {/* Source breakdown */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Sources · last 30 days</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              From your GA4 property · grouped by channel
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Open in GA4 <ExternalLink className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-[1.6fr_100px_120px_120px_90px] gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          {["Source / Medium", "Sessions", "Conv. rate", "Avg. duration", "Bounce"].map((c) => (
            <span
              key={c}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>

        {SOURCE_GROUPS.map((g) => {
          const Icon = g.icon;
          const groupTotal = g.rows.reduce((s, r) => s + r.sessions, 0);
          return (
            <section key={g.label} className="border-b border-border last:border-b-0">
              <div className="flex items-center justify-between bg-card/40 px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon
                    className={`size-3.5 ${g.accent ? "text-[var(--sp-accent)]" : "text-muted-foreground"}`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {groupTotal.toLocaleString()} sessions ·{" "}
                  {Math.round((groupTotal / totalSessions) * 100)}%
                </span>
              </div>
              <ul>
                {g.rows.map((r) => (
                  <li
                    key={r.source}
                    className="grid grid-cols-[1.6fr_100px_120px_120px_90px] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 transition-colors hover:bg-muted/40"
                  >
                    <span className="truncate font-mono text-xs text-foreground">
                      {r.source}
                    </span>
                    <span className="font-mono text-xs text-foreground">
                      {r.sessions.toLocaleString()}
                    </span>
                    <span className="font-mono text-xs text-foreground">{r.convRate}%</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.avgDur}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {r.bounce}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </Card>

      {/* User intent + top landing */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">User intent</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Classified from landing page + referrer keyword · matches your scan categories
              </p>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-5 space-y-4">
            {INTENT_FUNNEL.map((row) => (
              <div key={row.stage}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{row.stage}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-mono text-muted-foreground">
                      {row.sessions.toLocaleString()}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {row.share}%
                    </span>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: row.color }}
                    >
                      {row.convRate}% conv.
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.share}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <div className="rounded-md border border-[color-mix(in_srgb,var(--sp-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--sp-accent)_6%,transparent)] p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--sp-accent)]" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Conversion rate scales with intent stage as expected
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transactional sessions convert 10× better than informational. AI
                  engines drive proportionally more discovery/commercial traffic —
                  worth investing in transactional briefs to close the loop.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <p className="text-sm font-semibold text-foreground">Top landing pages</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              By session count · AI share = AI-referred sessions
            </p>
          </div>
          <ul className="divide-y divide-border">
            {TOP_LANDING.map((p) => (
              <li key={p.url} className="px-5 py-3">
                <p className="truncate font-mono text-xs font-medium text-foreground">
                  {p.url}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">
                    {p.sessions.toLocaleString()} sessions
                  </span>
                  <Badge size="sm" variant="accent">
                    {p.aiShare}% AI
                  </Badge>
                  <span className="font-mono">{p.convRate}% conv</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Optimization recommendations */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Optimization recommendations
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cross-referenced from scan, citations, GA4 behavior, and CWV data
            </p>
          </div>
          <Badge variant="accent">{RECOMMENDATIONS.length} actions</Badge>
        </div>
        <ul>
          {RECOMMENDATIONS.map((r) => {
            const Icon = r.icon;
            return (
              <li
                key={r.title}
                className="border-b border-border last:border-b-0 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" variant="muted">
                        {r.bucket}
                      </Badge>
                      <Badge size="sm" variant={PRIORITY_TONE[r.priority]}>
                        {r.priority}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {r.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                  </div>
                  <div className="hidden shrink-0 text-right md:block">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Impact
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-foreground">
                      {r.impact}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    Open
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — GA4 Data API integration ships in Phase 1.5 alongside persistence.
      </p>
    </>
  );
}
