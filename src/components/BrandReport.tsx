import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Copy,
  Megaphone,
  MessageSquare,
  Package,
  Palette,
  Quote,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

export interface ReportColour {
  name: string;
  hex: string;
  role?: string;
}

export interface BrandReportData {
  brandName?: string;
  handle?: string;
  brandPersonality?: string;
  targetAudience?: string;
  coreOffer?: string;
  brandColours?: ReportColour[];
  contentStyle?: string;
  websiteGoal?: string;
  keyMessage?: string;
  evidence?: string;
}

interface Section {
  key: keyof BrandReportData;
  number: string;
  title: string;
  icon: LucideIcon;
  value?: string;
}

function formatReport(report: BrandReportData): string {
  const colours = (report.brandColours ?? [])
    .map((c) => `${c.name} ${c.hex}${c.role ? ` (${c.role})` : ""}`)
    .join(", ");

  return [
    `Brand analysis${report.brandName ? ` — ${report.brandName}` : ""}${report.handle ? ` (${report.handle})` : ""}`,
    "",
    `1. BRAND PERSONALITY: ${report.brandPersonality ?? "—"}`,
    `2. TARGET AUDIENCE: ${report.targetAudience ?? "—"}`,
    `3. CORE OFFER: ${report.coreOffer ?? "—"}`,
    `4. BRAND COLOURS: ${colours || "—"}`,
    `5. CONTENT STYLE: ${report.contentStyle ?? "—"}`,
    `6. WEBSITE GOAL: ${report.websiteGoal ?? "—"}`,
    `7. KEY MESSAGE: ${report.keyMessage ?? "—"}`,
    report.evidence ? `\nEvidence: ${report.evidence}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function BrandReport({ report }: { report: BrandReportData }) {
  const sections: Section[] = [
    {
      key: "brandPersonality",
      number: "01",
      title: "Brand Personality",
      icon: Sparkles,
      value: report.brandPersonality,
    },
    {
      key: "targetAudience",
      number: "02",
      title: "Target Audience",
      icon: Users,
      value: report.targetAudience,
    },
    {
      key: "coreOffer",
      number: "03",
      title: "Core Offer",
      icon: Package,
      value: report.coreOffer,
    },
    {
      key: "contentStyle",
      number: "05",
      title: "Content Style",
      icon: MessageSquare,
      value: report.contentStyle,
    },
    {
      key: "websiteGoal",
      number: "06",
      title: "Website Goal",
      icon: Target,
      value: report.websiteGoal,
    },
  ];

  const colours = report.brandColours ?? [];

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatReport(report));
      toast.success("Report copied to clipboard");
    } catch {
      toast.error("Couldn't copy the report");
    }
  };

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      toast.success(`Copied ${hex}`);
    } catch {
      toast.error("Couldn't copy the colour");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Brand report
          </p>
          <h2 className="text-xl font-semibold tracking-tight">
            {report.brandName || report.handle || "Instagram profile"}
          </h2>
          {report.handle && (
            <p className="text-sm text-muted-foreground">{report.handle}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={copyAll}
        >
          <Copy className="size-4" />
          Copy report
        </Button>
      </div>

      {/* Key message — the payoff headline */}
      {report.keyMessage && (
        <div className="relative overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,oklch(0.97_0.03_75),oklch(0.95_0.05_20))] p-1">
          <div className="rounded-[calc(1rem-2px)] bg-card p-6 sm:p-8">
            <div className="flex items-center gap-2 text-primary">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                Key Message
              </Badge>
            </div>
            <div className="mt-4 flex gap-3">
              <Quote className="mt-1 size-6 shrink-0 text-primary/60" />
              <p className="text-lg font-semibold leading-snug tracking-tight sm:text-2xl">
                {report.keyMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          if (!section.value) return null;
          return (
            <Card key={section.key} className="border-border/70 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <section.icon className="size-4" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {section.number}
                  </span>
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground/80">
                  {section.value}
                </p>
              </CardContent>
            </Card>
          );
        })}

        {/* Brand colours with swatches */}
        {colours.length > 0 && (
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Palette className="size-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  04
                </span>
                <h3 className="text-sm font-semibold">Brand Colours</h3>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {colours.map((colour, index) => (
                  <button
                    key={`${colour.hex}-${index}`}
                    type="button"
                    onClick={() => copyHex(colour.hex)}
                    className="group flex items-center gap-2 rounded-full border border-border/70 bg-background pr-3 pl-1.5 py-1 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    title={`Copy ${colour.hex}`}
                  >
                    <span
                      className="size-6 rounded-full border border-black/10"
                      style={{ backgroundColor: colour.hex }}
                    />
                    <span className="flex flex-col leading-tight">
                      <span className="text-xs font-medium">{colour.name}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {colour.hex}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {report.evidence && (
        <div className="flex gap-3 rounded-xl border border-dashed border-border/80 bg-muted/40 p-4">
          <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence from the profile
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/80">
              {report.evidence}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
