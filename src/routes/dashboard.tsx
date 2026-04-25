import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, MessageCircle, Sparkles, TrendingUp, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppShell } from "@/components/app/AppShell";
import { KPICard } from "@/components/app/KPICard";
import { SectionCard } from "@/components/app/SectionCard";
import { CategoryBar } from "@/components/app/Charts";
import { Button } from "@/components/ui/button";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis } from "@/lib/cip/store";
import type { AnalysisPayload } from "@/lib/cip/types";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Customer Intelligence" }] }),
});

function Dashboard() {
  const [data, setData] = useState<AnalysisPayload>(sampleAnalysis);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAnalysis();
    if (stored) setData(stored);
  }, []);

  const { results, report } = data;

  const negPct = useMemo(() => {
    const neg = report.sentiment_summary["Negative"] ?? 0;
    return report.total_records ? Math.round((neg / report.total_records) * 100) : 0;
  }, [report]);

  const complaintPct = useMemo(() => {
    const c = results.filter((r) => r.is_complaint).length;
    return report.total_records ? Math.round((c / report.total_records) * 100) : 0;
  }, [results, report.total_records]);

  const messageTypeData = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.message_type, (m.get(r.message_type) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [results]);

  const sentimentData = useMemo(
    () => Object.entries(report.sentiment_summary).map(([name, value]) => ({ name, value: value as number })),
    [report.sentiment_summary],
  );

  const categoryData = useMemo(
    () => report.category_summary.map((c) => ({ name: c.category, value: c.count })),
    [report.category_summary],
  );

  const subData = useMemo(() => {
    const filtered = filterCategory
      ? results.filter((r) => r.category === filterCategory)
      : results;
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.sub_category, (m.get(r.sub_category) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [results, filterCategory]);

  const issuesData = useMemo(
    () => report.top_issues.map((i) => ({ name: i.issue, value: i.count })),
    [report.top_issues],
  );

  const rcaData = useMemo(() => {
    const m = new Map<string, number>();
    results.forEach((r) => m.set(r.root_cause, (m.get(r.root_cause) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [results]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsResults = XLSX.utils.json_to_sheet(results);
    XLSX.utils.book_append_sheet(wb, wsResults, "Results");
    const wsSummary = XLSX.utils.json_to_sheet([
      { metric: "Total Records", value: report.total_records },
      { metric: "Mapped Records", value: report.mapped_records },
      { metric: "Mapping Accuracy", value: `${(report.mapping_accuracy * 100).toFixed(1)}%` },
      { metric: "Negative Sentiment %", value: `${negPct}%` },
      { metric: "Summary", value: report.collective_summary },
    ]);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    XLSX.writeFile(wb, "customer-intelligence-report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(180, 30, 30);
    doc.text("Customer Intelligence Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Bank Muscat × AIONOS · Generated ${new Date().toLocaleDateString()}`, 14, 27);

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Executive Summary", 14, 40);
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(report.collective_summary, 180);
    doc.text(summary, 14, 47);

    autoTable(doc, {
      startY: 65,
      head: [["KPI", "Value"]],
      body: [
        ["Total records", String(report.total_records)],
        ["Mapped records", String(report.mapped_records)],
        ["Mapping accuracy", `${(report.mapping_accuracy * 100).toFixed(1)}%`],
        ["Negative sentiment", `${negPct}%`],
        ["Complaints", `${complaintPct}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.text("Top categories", 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Category", "Count"]],
      body: report.category_summary.map((c) => [c.category, String(c.count)]),
      theme: "striped",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.text("Top issues", 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Issue", "Count"]],
      body: report.top_issues.map((i) => [i.issue, String(i.count)]),
      theme: "striped",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text("Key Insights", 14, 20);
    doc.setFontSize(10);
    report.insights.forEach((ins, i) => {
      const t = doc.splitTextToSize(`• ${ins}`, 180);
      doc.text(t, 14, 30 + i * 10);
    });

    doc.save("customer-intelligence-report.pdf");
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.total_records} messages analyzed · {(report.mapping_accuracy * 100).toFixed(0)}% mapping accuracy
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/upload"><Upload className="mr-2 h-3.5 w-3.5" />New file</Link>
          </Button>
          <Button onClick={exportExcel} variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />Excel
          </Button>
          <Button onClick={exportPDF} size="sm" className="bg-primary hover:bg-primary/90">
            <FileText className="mr-2 h-3.5 w-3.5" />PDF report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label="Total records" value={report.total_records} hint="messages processed" index={0} />
        <KPICard label="Complaints" value={`${complaintPct}%`} hint={`${results.filter(r=>r.is_complaint).length} flagged`} tone="warning" index={1} />
        <KPICard
          label="Mapping accuracy"
          value={`${(report.mapping_accuracy * 100).toFixed(0)}%`}
          hint={`${report.mapped_records} of ${report.total_records}`}
          tone="success"
          index={2}
        />
        <KPICard label="Negative sentiment" value={`${negPct}%`} hint="of total messages" tone="danger" index={3} />
      </div>

      {/* Insights banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 overflow-hidden rounded-2xl border bg-gradient-card p-6 shadow-card"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Executive summary</div>
            <p className="mt-1 text-sm text-foreground">{report.collective_summary}</p>
            <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground md:grid-cols-3">
              {report.insights.map((ins, i) => (
                <li key={i} className="flex gap-2">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Message type" description="Distribution across complaints, questions and others">
          <CategoryBar data={messageTypeData} />
        </SectionCard>
        <SectionCard title="Sentiment" description="Customer sentiment breakdown">
          <CategoryBar data={sentimentData} />
        </SectionCard>
        <SectionCard
          title="Category distribution"
          description={filterCategory ? `Filtered: ${filterCategory}` : "Click a bar to drill into sub-categories"}
          action={
            filterCategory && (
              <button onClick={() => setFilterCategory(null)} className="text-xs text-primary hover:underline">
                Clear filter
              </button>
            )
          }
        >
          <div onClick={(e) => {
            const target = e.target as SVGElement;
            const name = target.closest("g")?.querySelector("text")?.textContent;
            if (name) setFilterCategory(name === filterCategory ? null : name);
          }}>
            <CategoryBar data={categoryData} />
          </div>
        </SectionCard>
        <SectionCard title="Sub-category breakdown" description={filterCategory ? `Within ${filterCategory}` : "All categories"}>
          <CategoryBar data={subData} horizontal />
        </SectionCard>
        <SectionCard title="Top issues" description="Most frequent customer issues">
          <CategoryBar data={issuesData} horizontal color="var(--color-chart-3)" />
        </SectionCard>
        <SectionCard title="Root cause distribution" description="Mapped from knowledge base">
          <CategoryBar data={rcaData} horizontal color="var(--color-chart-4)" />
        </SectionCard>
      </div>

      {/* Recent messages */}
      <SectionCard
        title="Recent messages"
        description="Latest classified customer messages"
        className="mt-6"
        action={
          <Button asChild variant="ghost" size="sm">
            <Link to="/data">View all <MessageCircle className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        }
      >
        <div className="space-y-2">
          {results.slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.is_complaint ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"
                    }`}
                  >
                    {r.message_type}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.category} › {r.sub_category} · {r.issue}
                  </span>
                </div>
                <p className="mt-1.5 truncate">{r.translated_text}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">RCA: {r.root_cause} · Action: {r.recommended_action}</p>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                <div>{r.sentiment}</div>
                <div>conf. {r.confidence_score.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
