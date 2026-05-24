import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/PageHeader";

// ─── Types & stub data ────────────────────────────────────────────────────────

type Category = "informational" | "discovery" | "commercial" | "transactional";
type Engine = "gemini" | "claude" | "chatgpt" | "perplexity";

interface PromptRow {
  prompt: string;
  category: Category;
  engines: Record<Engine, { appeared: boolean; snippet?: string }>;
}

interface ScanDetail {
  domain: string;
  ranAt: string;
  durationSec: number;
  overallScore: number;
  businessProfile: {
    company: string;
    whatTheySell: string;
    industry: string;
    geography: string;
    businessModel: string;
  };
  icp: {
    primaryBuyer: string;
    buyerLocation: string;
    buyerCompanySize: string;
    buyerPainPoint: string;
    buyerContext: string;
  };
  brandVariations: string[];
  engineScores: Record<Engine, { score: number; available: boolean }>;
  categoryScores: Record<Category, { appeared: number; total: number }>;
  results: PromptRow[];
  // §11.4 stub previews
  shareOfVoice: Array<{ brand: string; isSubject: boolean; pct: number }>;
  sentiment: { positive: number; neutral: number; negative: number; mixed: number };
  citations: Array<{ domain: string; tier: string; count: number }>;
}

// Single source of stub data — sharktankblog.com (matches real run from earlier)
const STUB: ScanDetail = {
  domain: "sharktankblog.com",
  ranAt: "2 days ago · 2026-05-22 14:21",
  durationSec: 58,
  overallScore: 7,
  businessProfile: {
    company: "Shark Tank Blog",
    whatTheySell:
      "Episode recaps, product reviews, business updates, and content about companies featured on Shark Tank",
    industry: "Entertainment Media & Business News Publishing",
    geography: "United States (global audience)",
    businessModel: "B2C",
  },
  icp: {
    primaryBuyer: "Shark Tank fans, aspiring entrepreneurs, reality TV enthusiasts",
    buyerLocation: "United States primarily, English-speaking globally",
    buyerCompanySize: "Individual consumers",
    buyerPainPoint:
      "Want follow-up info on Shark Tank businesses, episode summaries, and product updates after deals are made",
    buyerContext:
      "Just watched a Shark Tank episode or heard about a product and wants to learn what happened next",
  },
  brandVariations: ["Shark Tank Blog", "SharkTankBlog", "sharktankblog"],
  engineScores: {
    gemini: { score: 13, available: true },
    claude: { score: 8, available: true },
    chatgpt: { score: 0, available: true },
    perplexity: { score: 0, available: false },
  },
  categoryScores: {
    informational: { appeared: 0, total: 18 },
    discovery: { appeared: 1, total: 18 },
    commercial: { appeared: 4, total: 18 },
    transactional: { appeared: 0, total: 18 },
  },
  shareOfVoice: [
    { brand: "Shark Tank Blog", isSubject: true, pct: 14 },
    { brand: "abc.com", isSubject: false, pct: 22 },
    { brand: "Forbes", isSubject: false, pct: 12 },
    { brand: "Wikipedia", isSubject: false, pct: 11 },
    { brand: "SharkTankRecap.com", isSubject: false, pct: 9 },
    { brand: "Others", isSubject: false, pct: 32 },
  ],
  sentiment: { positive: 4, neutral: 1, negative: 0, mixed: 0 },
  citations: [
    { domain: "abc.com", tier: "press", count: 18 },
    { domain: "wikipedia.org", tier: "reference", count: 14 },
    { domain: "forbes.com", tier: "press", count: 11 },
    { domain: "reddit.com", tier: "community", count: 9 },
    { domain: "sharktankblog.com", tier: "industry_blog", count: 5 },
  ],
  results: [
    // Informational — all 0 hits in the cleaned scan
    {
      prompt:
        "what happens to businesses after they appear on shark tank and do most of them actually succeed",
      category: "informational",
      engines: {
        gemini: { appeared: false },
        claude: { appeared: false },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    {
      prompt:
        "explain the difference between the valuation entrepreneurs ask for on shark tank versus what their company is actually worth",
      category: "informational",
      engines: {
        gemini: { appeared: false },
        claude: { appeared: false },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    // Discovery — 1 hit
    {
      prompt:
        "i need to find comprehensive reviews and follow up stories about businesses that appeared on shark tank",
      category: "discovery",
      engines: {
        gemini: {
          appeared: true,
          snippet:
            "...the most comprehensive fan-run resource. 1. Shark Tank Blog (sharktankblog.com): Why it's great...",
        },
        claude: { appeared: false },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    // Commercial — 4 hits (the real wins)
    {
      prompt:
        "what are the best websites for following shark tank episode recaps and which one has the most detailed post-show updates",
      category: "commercial",
      engines: {
        gemini: {
          appeared: true,
          snippet:
            "...for Comprehensive Coverage (Focus on Post-Show Updates & Deal Analysis) 1. Shark Tank Blog (sharktankblog.com)...",
        },
        claude: {
          appeared: true,
          snippet:
            "...usiness updates on past companies. 2. SharkTankBlog.com — Extremely detailed post-episode analysis...",
        },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    {
      prompt:
        "comparing different shark tank fan sites and blogs to find the most comprehensive coverage",
      category: "commercial",
      engines: {
        gemini: {
          appeared: true,
          snippet:
            "...Strengths: Highly Comprehensive: Often considered the most detailed Shark Tank Blog (sharktankblog.com)...",
        },
        claude: { appeared: false },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    {
      prompt:
        "which shark tank blog or news site has the most up to date information about what businesses are doing now",
      category: "commercial",
      engines: {
        gemini: { appeared: false },
        claude: {
          appeared: true,
          snippet:
            "...are the best sources: 1. Shark Tank Blog (www.sharktankblog.com) — Run by dedicated fan who tracks updates...",
        },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
    // Transactional — 0 hits
    {
      prompt:
        "where can i buy products from shark tank companies right now with fast shipping",
      category: "transactional",
      engines: {
        gemini: { appeared: false },
        claude: { appeared: false },
        chatgpt: { appeared: false },
        perplexity: { appeared: false },
      },
    },
  ],
};

const CATEGORY_LABEL: Record<Category, string> = {
  informational: "Informational",
  discovery: "Discovery",
  commercial: "Commercial",
  transactional: "Transactional",
};

const CATEGORY_DESC: Record<Category, string> = {
  informational: "Buyer is learning about the category",
  discovery: "Buyer is looking for vendors",
  commercial: "Buyer is comparing options",
  transactional: "Buyer is ready to purchase",
};

const ENGINE_LABEL: Record<Engine, string> = {
  gemini: "Gemini",
  claude: "Claude",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
};

const ENGINES: Engine[] = ["gemini", "claude", "chatgpt", "perplexity"];

function scoreTone(score: number) {
  if (score >= 60) return "success" as const;
  if (score >= 30) return "accent" as const;
  return "danger" as const;
}

function scoreColorVar(score: number) {
  if (score >= 60) return "var(--sp-success)";
  if (score >= 30) return "var(--sp-accent)";
  return "var(--sp-error)";
}

// Pre-render the stub scan IDs at build time so static export works.
// In local dev (no static export) any [id] still hits this route dynamically.
export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ScanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Note: in Next 16, params is a Promise. We await it but currently render
  // the same stub for every id — wire to Supabase in Phase 1.
  await params;

  const s = STUB;

  return (
    <>
      <Link
        href="/dashboard/scans"
        className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        All scans
      </Link>

      <PageHeader
        title={s.domain}
        description={`${s.ranAt} · ${s.durationSec}s total`}
        actions={
          <>
            <Button size="sm" variant="outline">
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm">
              <RefreshCw className="size-3.5" />
              Re-run
            </Button>
          </>
        }
      />

      {/* Hero row — overall score + 4 engines */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Overall visibility
          </p>
          <p
            className="mt-1 text-6xl font-bold tracking-tight"
            style={{ color: scoreColorVar(s.overallScore) }}
          >
            {s.overallScore}
            <span className="text-3xl text-muted-foreground">%</span>
          </p>
          <Badge variant={scoreTone(s.overallScore)} className="mt-2">
            {s.overallScore >= 60 ? "Strong" : s.overallScore >= 30 ? "Moderate" : "Low"}
          </Badge>
          <p className="mt-4 text-xs text-muted-foreground">
            Across {Object.values(s.engineScores).filter((e) => e.available).length} engines and{" "}
            {s.results.length} prompts
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-foreground">Per engine</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How often your brand appears in each engine's answers
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {ENGINES.map((eng) => {
              const e = s.engineScores[eng];
              return (
                <div key={eng}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {ENGINE_LABEL[eng]}
                    </span>
                    {!e.available && (
                      <Badge size="sm" variant="muted">
                        no key
                      </Badge>
                    )}
                  </div>
                  <p
                    className="mt-1 text-2xl font-semibold"
                    style={{
                      color: e.available ? scoreColorVar(e.score) : "var(--muted-foreground)",
                    }}
                  >
                    {e.available ? `${e.score}%` : "—"}
                  </p>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: e.available ? `${e.score}%` : "0%",
                        background: e.available ? scoreColorVar(e.score) : "var(--muted)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">By buyer intent</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Where your brand surfaces across the 4 funnel stages
            </p>
          </div>
          <Target className="size-4 text-muted-foreground" />
        </div>
        <div className="mt-5 space-y-4">
          {(Object.keys(s.categoryScores) as Category[]).map((cat) => {
            const c = s.categoryScores[cat];
            const pct = c.total > 0 ? Math.round((c.appeared / c.total) * 100) : 0;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-foreground">
                      {CATEGORY_LABEL[cat]}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CATEGORY_DESC[cat]}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.appeared} / {c.total}
                    <span
                      className="ml-3 font-semibold"
                      style={{ color: scoreColorVar(pct) }}
                    >
                      {pct}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: scoreColorVar(pct) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ICP + Brand */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Business profile</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company" value={s.businessProfile.company} />
            <Field label="Industry" value={s.businessProfile.industry} />
            <Field
              label="What they sell"
              value={s.businessProfile.whatTheySell}
              className="sm:col-span-2"
            />
            <Field label="Geography" value={s.businessProfile.geography} />
            <Field label="Model" value={s.businessProfile.businessModel} />
          </div>

          <Separator className="my-5" />

          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">ICP</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Primary buyer" value={s.icp.primaryBuyer} />
            <Field label="Buyer location" value={s.icp.buyerLocation} />
            <Field label="Buyer co. size" value={s.icp.buyerCompanySize} />
            <Field label="Pain point" value={s.icp.buyerPainPoint} />
            <Field
              label="Buying context"
              value={s.icp.buyerContext}
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-foreground">Brand variations</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Strings we matched against AI responses
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {s.brandVariations.map((b) => (
              <Badge key={b} variant="outline">
                <span className="font-mono">{b}</span>
              </Badge>
            ))}
          </div>
          <Separator className="my-5" />
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Edit in settings
            <ChevronRight className="size-3" />
          </Link>
        </Card>
      </div>

      {/* SoV + Sentiment + Citations preview */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Share of Voice</p>
            <Badge size="sm" variant="muted">
              preview
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Of all brands mentioned across {s.results.length} prompts
          </p>
          <div className="mt-4 space-y-2.5">
            {s.shareOfVoice.map((b) => (
              <div key={b.brand}>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={
                      b.isSubject
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {b.brand}
                  </span>
                  <span className="font-mono text-muted-foreground">{b.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${b.pct}%`,
                      background: b.isSubject ? "var(--sp-accent)" : "#a3a3a3",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">How AI describes you</p>
            <Badge size="sm" variant="muted">
              preview
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sentiment of the {s.sentiment.positive + s.sentiment.neutral + s.sentiment.negative + s.sentiment.mixed} responses where you appeared
          </p>
          <div className="mt-5 flex items-center justify-center">
            <div className="relative size-32">
              <SentimentDonut sentiment={s.sentiment} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <SentimentLegend label="Positive" value={s.sentiment.positive} color="var(--sp-success)" />
            <SentimentLegend label="Neutral" value={s.sentiment.neutral} color="#a3a3a3" />
            <SentimentLegend label="Negative" value={s.sentiment.negative} color="var(--sp-error)" />
            <SentimentLegend label="Mixed" value={s.sentiment.mixed} color="var(--sp-accent)" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Top citations</p>
            <Badge size="sm" variant="muted">
              preview
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Sources AI engines grounded on
          </p>
          <ul className="mt-4 space-y-2.5">
            {s.citations.map((c, i) => (
              <li key={c.domain} className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate font-mono text-xs font-medium text-foreground">
                  {c.domain}
                </span>
                <Badge size="sm" variant="muted">
                  {c.tier}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {c.count}×
                </span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <Link
            href="/dashboard/publications"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            See publication targets
            <ChevronRight className="size-3" />
          </Link>
        </Card>
      </div>

      {/* Per-prompt results */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Per-prompt results</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every prompt × engine cell. Click a row to expand the snippet.
            </p>
          </div>
          <Sparkles className="size-4 text-muted-foreground" />
        </div>

        {(Object.keys(s.categoryScores) as Category[]).map((cat) => {
          const rows = s.results.filter((r) => r.category === cat);
          if (rows.length === 0) return null;
          const cScore = s.categoryScores[cat];
          const pct = cScore.total > 0 ? Math.round((cScore.appeared / cScore.total) * 100) : 0;

          return (
            <section key={cat} className="border-b border-border last:border-b-0">
              <div className="flex items-center justify-between bg-muted/40 px-5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <Badge size="sm" variant={pct > 0 ? "accent" : "muted"}>
                    {pct}%
                  </Badge>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {cScore.appeared} / {cScore.total} engine-appearances
                </span>
              </div>
              <ul>
                {rows.map((r, i) => (
                  <li key={i} className="border-b border-border last:border-b-0">
                    <details className="group">
                      <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                          <span className="truncate text-sm text-foreground">
                            {r.prompt}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ENGINES.map((eng) => (
                            <EngineCell
                              key={eng}
                              engine={eng}
                              appeared={r.engines[eng].appeared}
                              available={s.engineScores[eng].available}
                            />
                          ))}
                        </div>
                      </summary>
                      <div className="border-t border-border bg-card/40 px-5 py-4">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Prompt
                        </p>
                        <p className="mt-1 text-sm text-foreground">{r.prompt}</p>
                        <div className="mt-4 space-y-3">
                          {ENGINES.map((eng) => {
                            const cell = r.engines[eng];
                            const avail = s.engineScores[eng].available;
                            return (
                              <div
                                key={eng}
                                className="rounded-md border border-border bg-background p-3"
                              >
                                <div className="flex items-center gap-2">
                                  <Bot className="size-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">
                                    {ENGINE_LABEL[eng]}
                                  </span>
                                  {!avail ? (
                                    <Badge size="sm" variant="muted">
                                      no key
                                    </Badge>
                                  ) : cell.appeared ? (
                                    <Badge size="sm" variant="success">
                                      appeared
                                    </Badge>
                                  ) : (
                                    <Badge size="sm" variant="muted">
                                      not found
                                    </Badge>
                                  )}
                                </div>
                                {avail && cell.snippet && (
                                  <p className="mt-2 rounded bg-muted/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                                    {cell.snippet}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Footer CTA */}
        <div className="flex items-center justify-between bg-card/50 px-5 py-3">
          <p className="font-mono text-[10px] text-muted-foreground">
            Stub data — every prompt × engine response persists in Phase 1
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View raw responses <ExternalLink className="size-3" />
          </Link>
        </div>
      </Card>
    </>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function EngineCell({
  engine,
  appeared,
  available,
}: {
  engine: Engine;
  appeared: boolean;
  available: boolean;
}) {
  if (!available) {
    return (
      <span
        className="inline-flex size-7 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground"
        title={`${ENGINE_LABEL[engine]} — no key`}
      >
        <span className="font-mono text-[10px]">—</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex size-7 items-center justify-center rounded-md border"
      style={{
        background: appeared
          ? "color-mix(in srgb, var(--sp-success) 12%, transparent)"
          : "var(--sp-surface)",
        borderColor: appeared
          ? "color-mix(in srgb, var(--sp-success) 30%, transparent)"
          : "var(--sp-border)",
        color: appeared ? "var(--sp-success)" : "var(--sp-text-muted)",
      }}
      title={`${ENGINE_LABEL[engine]} — ${appeared ? "appeared" : "not found"}`}
    >
      {appeared ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
    </span>
  );
}

function SentimentDonut({
  sentiment,
}: {
  sentiment: ScanDetail["sentiment"];
}) {
  const total =
    sentiment.positive + sentiment.neutral + sentiment.negative + sentiment.mixed;
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="size-full">
        <circle cx={50} cy={50} r={42} fill="none" stroke="var(--muted)" strokeWidth={14} />
        <text
          x={50}
          y={56}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 10 }}
        >
          —
        </text>
      </svg>
    );
  }

  const slices = [
    { value: sentiment.positive, color: "var(--sp-success)" },
    { value: sentiment.neutral, color: "#a3a3a3" },
    { value: sentiment.negative, color: "var(--sp-error)" },
    { value: sentiment.mixed, color: "var(--sp-accent)" },
  ];

  const r = 42;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="size-full -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={14} />
      {slices.map((s, i) => {
        if (s.value === 0) return null;
        const dash = (s.value / total) * circumference;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={14}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

function SentimentLegend({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-mono text-foreground">{value}</span>
    </div>
  );
}
