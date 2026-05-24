import { Compass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";

type Bucket = "defend" | "fix_urgent" | "sustaining" | "deprioritise";

const BUCKETS: Record<Bucket, { label: string; description: string; tone: "success" | "danger" | "accent" | "muted"; count: number }> = {
  defend:       { label: "Defend",       description: "High demand · already strong",  tone: "success", count: 3 },
  fix_urgent:   { label: "Fix urgent",   description: "High demand · invisible",       tone: "danger",  count: 7 },
  sustaining:   { label: "Sustaining",   description: "Lower demand · already strong", tone: "accent",  count: 5 },
  deprioritise: { label: "Deprioritise", description: "Lower demand · invisible",      tone: "muted",   count: 9 },
};

const FIX_URGENT_PROMPTS = [
  "best compostable food containers for cloud kitchens in bangalore",
  "where to buy bulk compostable cutlery in india",
  "wholesale compostable packaging suppliers for restaurants india",
  "compostable bags cpcb certified manufacturers",
];

export default function StrategyPage() {
  return (
    <>
      <PageHeader
        title="Strategy"
        description="Where to put your effort: demand × AI visibility, mapped to action buckets."
      />

      {/* Quadrant grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(BUCKETS) as Bucket[]).map((key) => {
          const b = BUCKETS[key];
          return (
            <Card key={key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant={b.tone}>{b.label}</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
                </div>
                <span className="text-3xl font-semibold tabular-nums text-foreground">
                  {b.count}
                </span>
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                prompts in bucket
              </p>
            </Card>
          );
        })}
      </div>

      {/* Quadrant chart placeholder */}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-border p-5">
          <p className="text-sm font-semibold text-foreground">Demand × AI visibility</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each dot is a prompt. Hover for detail.
          </p>
        </div>
        <div className="relative h-80">
          <QuadrantMock />
        </div>
      </Card>

      {/* Top fix-urgent list */}
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">Top fix-urgent prompts</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              High demand. Zero appearance. Pick these first.
            </p>
          </div>
          <Compass className="size-4 text-[var(--sp-accent)]" />
        </div>
        <ul className="divide-y divide-border">
          {FIX_URGENT_PROMPTS.map((p, i) => (
            <li key={i} className="flex items-center justify-between px-5 py-3">
              <span className="truncate pr-4 text-sm text-foreground">{p}</span>
              <Badge variant="danger">0%</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-6 font-mono text-[10px] text-muted-foreground">
        Stub data — strategy map computes from real keyword + scan data in Phase 5.
      </p>
    </>
  );
}

function QuadrantMock() {
  // 24 mock dots positioned in the demand×visibility plane
  const dots: Array<{ x: number; y: number; bucket: Bucket }> = [
    { x: 0.85, y: 0.82, bucket: "defend" },
    { x: 0.78, y: 0.75, bucket: "defend" },
    { x: 0.71, y: 0.91, bucket: "defend" },
    { x: 0.86, y: 0.12, bucket: "fix_urgent" },
    { x: 0.79, y: 0.05, bucket: "fix_urgent" },
    { x: 0.72, y: 0.16, bucket: "fix_urgent" },
    { x: 0.93, y: 0.21, bucket: "fix_urgent" },
    { x: 0.66, y: 0.08, bucket: "fix_urgent" },
    { x: 0.81, y: 0.18, bucket: "fix_urgent" },
    { x: 0.74, y: 0.04, bucket: "fix_urgent" },
    { x: 0.22, y: 0.72, bucket: "sustaining" },
    { x: 0.32, y: 0.81, bucket: "sustaining" },
    { x: 0.18, y: 0.66, bucket: "sustaining" },
    { x: 0.28, y: 0.88, bucket: "sustaining" },
    { x: 0.36, y: 0.7,  bucket: "sustaining" },
    { x: 0.15, y: 0.18, bucket: "deprioritise" },
    { x: 0.21, y: 0.24, bucket: "deprioritise" },
    { x: 0.32, y: 0.12, bucket: "deprioritise" },
    { x: 0.11, y: 0.31, bucket: "deprioritise" },
    { x: 0.25, y: 0.06, bucket: "deprioritise" },
    { x: 0.38, y: 0.2,  bucket: "deprioritise" },
    { x: 0.08, y: 0.22, bucket: "deprioritise" },
    { x: 0.17, y: 0.42, bucket: "deprioritise" },
    { x: 0.4,  y: 0.11, bucket: "deprioritise" },
  ];

  const color: Record<Bucket, string> = {
    defend: "var(--sp-success)",
    fix_urgent: "var(--sp-error)",
    sustaining: "var(--sp-accent)",
    deprioritise: "#a3a3a3",
  };

  return (
    <svg viewBox="0 0 400 320" className="h-full w-full">
      {/* axes */}
      <line x1={200} y1={0} x2={200} y2={320} stroke="currentColor" className="text-border" strokeDasharray="3 3" />
      <line x1={0} y1={160} x2={400} y2={160} stroke="currentColor" className="text-border" strokeDasharray="3 3" />
      {/* axis labels */}
      <text x={394} y={170} fontSize={9} textAnchor="end" className="fill-muted-foreground font-mono uppercase tracking-wider">
        ← demand →
      </text>
      <text x={206} y={12} fontSize={9} className="fill-muted-foreground font-mono uppercase tracking-wider">
        ↑ visibility
      </text>
      {/* quadrant labels */}
      <text x={300} y={50} fontSize={11} textAnchor="middle" className="fill-foreground font-medium">
        Defend
      </text>
      <text x={300} y={290} fontSize={11} textAnchor="middle" className="fill-[var(--sp-error)] font-medium">
        Fix urgent
      </text>
      <text x={100} y={50} fontSize={11} textAnchor="middle" className="fill-muted-foreground">
        Sustaining
      </text>
      <text x={100} y={290} fontSize={11} textAnchor="middle" className="fill-muted-foreground">
        Deprioritise
      </text>

      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x * 400}
          cy={(1 - d.y) * 320}
          r={5}
          fill={color[d.bucket]}
          opacity={0.7}
        />
      ))}
    </svg>
  );
}
