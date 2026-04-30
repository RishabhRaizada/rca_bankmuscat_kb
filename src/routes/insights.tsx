import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, ListChecks, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis } from "@/lib/cip/store";
import type { AnalysisPayload } from "@/lib/cip/types";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const [data, setData] = useState<AnalysisPayload>(sampleAnalysis);

  useEffect(() => {
    const s = loadAnalysis();
    if (s) setData(s);
  }, []);

  const { results, report } = data;

  // ✅ FIX: Clean blank insights
  const cleanInsights = useMemo(() => {
    return report.insights.map((ins) => {
      if (!ins || ins.trim() === "" || ins.includes("''") || ins.includes('""')) {
        return "Statements";
      }

      // replace patterns like: is ''  OR is ""
      return ins.replace(/is\s*['"]{2}/gi, "could not be determined");
    });
  }, [report.insights]);

  const negCount = report.sentiment_summary["Negative"] ?? 0;
  const negPct = report.total_records
    ? Math.round((negCount / report.total_records) * 100)
    : 0;

  const riskAreas = useMemo(() => {
    const map = new Map<string, number>();
    results
      .filter((r) => r.is_complaint || r.sentiment === "Negative")
      .forEach((r) => {
        const k = `${r.category || "Unknown category"} › ${r.sub_category || "Unknown sub-category"}`;
        map.set(k, (map.get(k) ?? 0) + 1);
      });

    return Array.from(map, ([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [results]);

  const recommendations = useMemo(() => {
    const map = new Map<string, number>();

    results.forEach((r) => {
      const action =
        r.recommended_action && r.recommended_action.trim() !== ""
          ? r.recommended_action
          : "No recommendation available";

      map.set(action, (map.get(action) ?? 0) + 1);
    });

    return Array.from(map, ([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [results]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive narrative, risk areas, and operational recommendations.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">

          {/* ✅ KEY INSIGHTS */}
          <SectionCard title="Key insights" description="What the data is telling us">
            <ul className="space-y-2.5">
              {cleanInsights.map((ins, i) => (
                <li key={i} className="flex gap-3 rounded-lg border bg-background p-3">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span className="text-sm">{ins}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* ✅ RECOMMENDATIONS */}
          <SectionCard title="Recommended actions" description="Most frequent next-best actions">
            <ul className="space-y-2">
              {recommendations.map((r, i) => (
                <li
                  key={r.action}
                  className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </div>
                    <span>{r.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.count} cases</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">

          {/* ✅ RISK AREAS */}
          <SectionCard title="Risk areas" description="Highest-volume negative areas">
            <ul className="space-y-2">
              {riskAreas.length === 0 ? (
                <li className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> No critical risks detected.
                </li>
              ) : (
                riskAreas.map((r) => (
                  <li key={r.area} className="rounded-lg border bg-background p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">{r.area}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {r.count} negative messages
                    </div>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>

          {/* ✅ COVERAGE */}
          <SectionCard title="Coverage health" description="Knowledge base mapping">
            <div className="space-y-3">
              <Stat
                icon={CheckCircle2}
                label="Mapped"
                value={`${report.mapped_records}/${report.total_records}`}
                tone="success"
              />
              <Stat
                icon={TrendingUp}
                label="Accuracy"
                value={`${(report.mapping_accuracy * 100).toFixed(1)}%`}
                tone="primary"
              />
              <Stat icon={ListChecks} label="Categories" value={String(report.category_summary.length)} />
              <Stat icon={ListChecks} label="Issues" value={String(report.top_issues.length)} />
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: any;
  label: string;
  value: string;
  tone?: "success" | "primary" | "default";
}) {
  const cls =
    tone === "success"
      ? "text-success"
      : tone === "primary"
      ? "text-primary"
      : "text-foreground";

  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`h-4 w-4 ${cls}`} />
        {label}
      </div>
      <div className={`text-sm font-semibold ${cls}`}>{value}</div>
    </div>
  );
}