import { AlertTriangle, BellOff, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface Alert {
  id: string;
  type: "appearance_drop" | "sentiment_shift" | "competitor_surge";
  metric: string;
  baseline: string;
  current: string;
  deltaSigma: number;
  triggeredAt: string;
  acknowledged: boolean;
}

const ALERTS: Alert[] = [
  {
    id: "1",
    type: "competitor_surge",
    metric: "Competitor A · appearance rate on Gemini",
    baseline: "21%",
    current: "39%",
    deltaSigma: 3.4,
    triggeredAt: "4 hours ago",
    acknowledged: false,
  },
  {
    id: "2",
    type: "sentiment_shift",
    metric: "ChatGPT · sentiment on 'best CRM for B2B' prompts",
    baseline: "neutral",
    current: "negative",
    deltaSigma: 2.1,
    triggeredAt: "yesterday",
    acknowledged: false,
  },
  {
    id: "3",
    type: "appearance_drop",
    metric: "Your appearance rate on Perplexity",
    baseline: "38%",
    current: "12%",
    deltaSigma: 4.8,
    triggeredAt: "2 days ago",
    acknowledged: true,
  },
];

const TYPE_LABEL: Record<Alert["type"], string> = {
  appearance_drop: "Appearance drop",
  sentiment_shift: "Sentiment shift",
  competitor_surge: "Competitor surge",
};

export default function AlertsPage() {
  const active = ALERTS.filter((a) => !a.acknowledged);
  const acked = ALERTS.filter((a) => a.acknowledged);

  return (
    <>
      <PageHeader
        title="Alerts"
        description="We watch your scans daily and ping you when anything drifts more than 2σ from baseline."
        actions={
          <Button size="sm" variant="outline">
            <BellOff className="size-3.5" />
            Pause alerts
          </Button>
        }
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Active ({active.length})
        </h2>
        <div className="space-y-3">
          {active.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--sp-error)_12%,transparent)] text-[var(--sp-error)]">
                  <AlertTriangle className="size-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="danger">{TYPE_LABEL[a.type]}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {a.deltaSigma.toFixed(1)}σ
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      · {a.triggeredAt}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">{a.metric}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Baseline <span className="font-mono">{a.baseline}</span> → now{" "}
                    <span className="font-mono">{a.current}</span>
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Check className="size-3.5" />
                  Acknowledge
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Acknowledged ({acked.length})
        </h2>
        <div className="space-y-3">
          {acked.map((a) => (
            <Card key={a.id} className="p-4 opacity-70">
              <div className="flex items-center gap-3">
                <Badge variant="muted">{TYPE_LABEL[a.type]}</Badge>
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {a.metric}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {a.triggeredAt}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <p className="mt-8 font-mono text-[10px] text-muted-foreground">
        Stub data — drift detector cron ships in Phase 7.
      </p>
    </>
  );
}
