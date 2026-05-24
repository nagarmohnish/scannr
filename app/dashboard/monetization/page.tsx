import {
  ArrowRight,
  Banknote,
  Bot,
  CircleDollarSign,
  ExternalLink,
  Handshake,
  Layers,
  Megaphone,
  Palette,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

// ─── Stub data ────────────────────────────────────────────────────────────────

const CHANNELS = [
  {
    type: "Display ads · owned",
    icon: Layers,
    sessions: 18_412,
    fillRate: 84,
    ecpm: 6.4,
    revenue: 9_984,
    headroom: "+$3.4k by switching SSP wrapper to Prebid 9",
  },
  {
    type: "Native + in-content",
    icon: Palette,
    sessions: 14_201,
    fillRate: 91,
    ecpm: 3.2,
    revenue: 4_104,
    headroom: "+$1.1k by adding Outbrain to in-content slot",
  },
  {
    type: "Sponsored content",
    icon: Megaphone,
    sessions: 6_412,
    fillRate: 40,
    ecpm: 28.0,
    revenue: 7_180,
    headroom: "2 IO holes · est. +$5.2k if filled",
  },
  {
    type: "Affiliate (Amazon, Impact)",
    icon: ShoppingBag,
    sessions: 9_182,
    fillRate: null,
    ecpm: null,
    revenue: 12_640,
    headroom: "AI-driven traffic over-indexes 2.1× — push deeper PLP linking",
  },
  {
    type: "Newsletter sponsorship",
    icon: Wallet,
    sessions: 1_847,
    fillRate: 100,
    ecpm: 45.0,
    revenue: 3_120,
    headroom: "Sold out · upsell to bi-weekly",
  },
];

const OPPORTUNITIES = [
  {
    title: "AI traffic is undermonetized — set up direct deals on transactional pages",
    icon: Bot,
    revenue: "+$8,200 / mo",
    confidence: "high" as const,
    description:
      "ChatGPT + Perplexity referrers convert 1.8× site average but currently see only programmatic display. Spin up a direct IO marketplace targeting the 3 highest-intent landing pages.",
    levers: ["High-intent visitors", "Premium dwell time", "Direct deal margins"],
  },
  {
    title: "Reddit & Quora referrals are pure community — add affiliate widget",
    icon: Users,
    revenue: "+$3,400 / mo",
    confidence: "high" as const,
    description:
      "Reddit drives 1,887 sessions/mo with 1.2% on-site conversion. Adding a contextual product widget on landing pages would lift affiliate take 30-40%.",
    levers: ["Community trust signal", "Existing infrastructure", "Trivial implementation"],
  },
  {
    title: "Newsletter cap reached — second send adds 25% inventory",
    icon: Banknote,
    revenue: "+$780 / mo",
    confidence: "medium" as const,
    description:
      "Tuesday send is 100% sold through. A Friday digest with curated AI-trend content unlocks a second sponsorship slot at similar yield.",
    levers: ["Existing list", "Audience overlap data", "Same sales motion"],
  },
  {
    title: "Header bidding — switch from open auction to Prebid 9",
    icon: TrendingUp,
    revenue: "+$3,400 / mo",
    confidence: "medium" as const,
    description:
      "Current setup leaves ~12% revenue on the table per industry benchmarks. Prebid 9 + 4 SSP partners (PubMatic, Magnite, AppNexus, Index) restores yield.",
    levers: ["Pure tech change", "No content lift", "Vendor support available"],
  },
];

const BRAND_PARTNERS = [
  { brand: "Eco365",         category: "Sustainability gear", fit: 96, contact: "in-discussion" },
  { brand: "Saathi",          category: "Compostable goods",   fit: 94, contact: "warm intro" },
  { brand: "Bare Necessities",category: "Zero-waste B2B",      fit: 91, contact: "needs research" },
  { brand: "Boltt",           category: "Adjacent eco-DTC",    fit: 78, contact: "cold" },
];

const CONFIDENCE_TONE: Record<"high" | "medium" | "low", "success" | "accent" | "muted"> = {
  high: "success",
  medium: "accent",
  low: "muted",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonetizationPage() {
  const totalRevenue = CHANNELS.reduce((s, c) => s + c.revenue, 0);
  const headroom = OPPORTUNITIES.reduce((sum, o) => {
    const match = o.revenue.match(/\$(\d[\d,]*)/);
    return sum + (match ? parseInt(match[1].replace(/,/g, ""), 10) : 0);
  }, 0);

  return (
    <>
      <PageHeader
        title="Monetization"
        description="Yield management across every surface your audience touches — owned, social, AI-referred, partnerships."
        actions={
          <Button size="sm" variant="outline">
            <ExternalLink className="size-3.5" />
            Connect SSP
          </Button>
        }
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue · 30d"
          value={`$${totalRevenue.toLocaleString()}`}
          delta={{ value: "+12%", direction: "up" }}
          hint="across all channels"
        />
        <StatCard
          label="eCPM · blended"
          value="$8.40"
          delta={{ value: "+$0.80", direction: "up" }}
          hint="weighted by impressions"
        />
        <StatCard
          label="Headroom"
          value={`$${headroom.toLocaleString()}`}
          hint={`${OPPORTUNITIES.length} unlocked opportunities`}
        />
        <StatCard
          label="AI yield premium"
          value="1.8×"
          delta={{ value: "+0.2×", direction: "up" }}
          hint="vs. organic search yield"
        />
      </div>

      {/* Channel yield breakdown */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Channels</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fill, eCPM, and revenue per monetization surface · last 30 days
            </p>
          </div>
          <CircleDollarSign className="size-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-[1.6fr_100px_100px_120px_1fr] gap-3 border-b border-border bg-muted/40 px-5 py-2.5">
          {["Channel", "Fill rate", "eCPM", "Revenue", "Headroom"].map((c) => (
            <span
              key={c}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>

        <ul>
          {CHANNELS.map((c, i) => {
            const Icon = c.icon;
            return (
              <li
                key={c.type}
                className={`grid grid-cols-[1.6fr_100px_100px_120px_1fr] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                  i < CHANNELS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{c.type}</span>
                </div>
                <span className="font-mono text-xs text-foreground">
                  {c.fillRate !== null ? `${c.fillRate}%` : "—"}
                </span>
                <span className="font-mono text-xs text-foreground">
                  {c.ecpm !== null ? `$${c.ecpm.toFixed(2)}` : "—"}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  ${c.revenue.toLocaleString()}
                </span>
                <span className="truncate text-xs text-muted-foreground" title={c.headroom}>
                  {c.headroom}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Opportunities */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Revenue opportunities</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cross-referenced from yield benchmarks, GA4 behavior, and your scan data
            </p>
          </div>
          <Badge variant="accent">{OPPORTUNITIES.length} actions</Badge>
        </div>

        <ul>
          {OPPORTUNITIES.map((o) => {
            const Icon = o.icon;
            return (
              <li
                key={o.title}
                className="border-b border-border last:border-b-0 px-5 py-5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--sp-accent)_10%,transparent)] text-[var(--sp-accent)]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" variant={CONFIDENCE_TONE[o.confidence]}>
                        {o.confidence} confidence
                      </Badge>
                      <span className="font-mono text-sm font-semibold text-[var(--sp-accent)]">
                        {o.revenue}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {o.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {o.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.levers.map((l) => (
                        <Badge key={l} size="sm" variant="muted">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0">
                    Plan
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Brand partnerships + AI-mentions monetization */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <p className="text-sm font-semibold text-foreground">Partner matches</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Brands whose audience overlaps yours · ranked by ICP fit
              </p>
            </div>
            <Handshake className="size-4 text-muted-foreground" />
          </div>
          <ul>
            {BRAND_PARTNERS.map((p, i) => (
              <li
                key={p.brand}
                className={`grid grid-cols-[1fr_1fr_100px_140px] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40 ${
                  i < BRAND_PARTNERS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground">{p.brand}</span>
                <span className="text-xs text-muted-foreground">{p.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{p.fit}%</span>
                  <div className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[var(--sp-accent)]"
                      style={{ width: `${p.fit}%` }}
                    />
                  </div>
                </div>
                <Badge size="sm" variant="muted">
                  {p.contact}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--sp-accent)]" />
            <p className="text-sm font-semibold text-foreground">Sponsored AI mentions</p>
            <Badge size="sm" variant="muted">
              experimental
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            As LLMs roll out sponsored answers (OpenAI ads, Perplexity sponsored
            sources), we'll surface inventory + bidding here. Track auction floor
            prices and forecast yield from your category.
          </p>
          <Separator className="my-4" />
          <div className="space-y-3">
            <Row label="ChatGPT (ads beta)" value="—" sub="No public auction yet" />
            <Row label="Perplexity Sponsored" value="$12.40 CPC" sub="Avg. category bid" />
            <Row label="Gemini overlays" value="—" sub="Not launched" />
          </div>
          <Button size="sm" variant="outline" className="mt-4 w-full">
            Join waitlist
          </Button>
        </Card>
      </div>

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — SSP wrapper + GA4 + partnership matcher all wire up after Phase 1.
      </p>
    </>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
      </div>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
