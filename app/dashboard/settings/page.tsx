import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/dashboard/PageHeader";

const COMPETITORS = ["Acme Co", "Beta Co", "Gamma Inc"];
const BRAND_VARIATIONS = ["Acme Compost", "AcmeCompost", "acmecompost"];

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace, brand identity, competitors, alerts, and billing."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Workspace */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">Workspace</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Identity that scans, alerts, and briefs hang off.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Workspace name" value="Acme Compost" />
            <Field label="Primary domain" value="acmecompost.com" mono />
            <Field label="Industry" value="Sustainable food packaging" />
            <Field label="Geography" value="India · global" />
          </div>
        </Card>

        {/* Plan */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Plan</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Free preview</p>
          <Separator className="my-4" />
          <Stat label="Scans this month" value="3 / 3" />
          <Stat label="Tracked competitors" value="3 / 3" />
          <Stat label="Alerts" value="Off" />
          <Separator className="my-4" />
          <Button size="sm" className="w-full">
            Upgrade to Starter
          </Button>
        </Card>

        {/* Brand variations */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Brand variations</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Strings we match against AI responses to detect your brand.
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {BRAND_VARIATIONS.map((b) => (
              <Badge key={b} variant="outline" className="gap-1.5 pr-1">
                <span className="font-mono">{b}</span>
                <button
                  type="button"
                  className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${b}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </Card>

        {/* Competitors */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Competitors</h3>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {COMPETITORS.map((c) => (
              <li
                key={c}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="text-sm text-foreground">{c}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${c}`}
                >
                  <X className="size-3.5" />
                </button>
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

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex items-center justify-between text-xs last:mb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
