import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, MessageCircle, Upload } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppShell } from "@/components/app/AppShell";
import { KPICard } from "@/components/app/KPICard";
import { SectionCard } from "@/components/app/SectionCard";
import { CategoryBar, SentimentPie } from "@/components/app/Charts";
import { Button } from "@/components/ui/button";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis } from "@/lib/cip/store";
import type { AnalysisPayload } from "@/lib/cip/types";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Customer Intelligence" }] }),
});

const MESSAGE_TYPE_COLORS: Record<string, string> = {
  Complaint: "#ef4444",
  Inquiry:   "#3b82f6",
  Request:   "#a855f7",
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#22c55e",
  Neutral:  "#94a3b8",
  Negative: "#ef4444",
};

function sentimentBadge(sentiment: string) {
  if (sentiment === "Negative") return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  if (sentiment === "Positive") return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
}

function messageTypeBadge(type: string) {
  if (type === "Complaint") return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
  if (type === "Inquiry")   return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-muted text-muted-foreground";
}

function Dashboard() {
  const [data, setData] = useState<AnalysisPayload>(sampleAnalysis);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAnalysis();
    if (stored) setData(stored);
  }, []);

  const { results, report } = data;

  const totalInput = results.length;

  const statementCount = useMemo(
    () => results.filter((r) => r.message_type.toLowerCase() === "statement").length,
    [results],
  );

  const failedCount = useMemo(
    () => results.filter((r) => r.message_type.toLowerCase() === "unclassified").length,
    [results],
  );

  // Exclude statements & failed — only actionable messages count
  const processedResults = useMemo(
    () => results.filter((r) => {
      const t = r.message_type.toLowerCase();
      return t !== "statement" && t !== "unclassified";
    }),
    [results],
  );
  const totalProcessed = processedResults.length;

  const complaintCount = useMemo(
    () => processedResults.filter((r) => r.message_type === "Complaint").length,
    [processedResults],
  );
  const inquiryCount = totalProcessed - complaintCount;
  const complaintPct = totalProcessed ? Math.round((complaintCount / totalProcessed) * 100) : 0;

  const mappedProcessed = useMemo(
    () => processedResults.filter((r) => r.is_mapped).length,
    [processedResults],
  );
  const mappingAccuracyProcessed = totalProcessed ? mappedProcessed / totalProcessed : 0;

  const messageTypeData = useMemo(() => {
    const m = new Map<string, number>();
    processedResults.forEach((r) => m.set(r.message_type, (m.get(r.message_type) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [processedResults]);

  const sentimentData = useMemo(() => {
    const mapped = new Map<string, number>();
    processedResults.forEach((r) => {
      const label = r.sentiment?.trim() || "Positive";
      const normalised =
        label.toLowerCase() === "negative" ? "Negative" :
        label.toLowerCase() === "positive" ? "Positive" : "Neutral";
      mapped.set(normalised, (mapped.get(normalised) ?? 0) + 1);
    });
    return Array.from(mapped, ([name, value]) => ({ name, value }));
  }, [processedResults]);

  const categoryData = useMemo(() => {
    const m = new Map<string, number>();
    processedResults.forEach((r) => m.set(r.category, (m.get(r.category) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [processedResults]);

  const issuesData = useMemo(() => {
    const m = new Map<string, number>();
    processedResults.forEach((r) => {
      if (r.issue) m.set(r.issue, (m.get(r.issue) ?? 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [processedResults]);

  const subData = useMemo(() => {
    const filtered = filterCategory
      ? processedResults.filter((r) => r.category === filterCategory)
      : processedResults;
    const m = new Map<string, number>();
    filtered.forEach((r) => m.set(r.sub_category, (m.get(r.sub_category) ?? 0) + 1));
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [processedResults, filterCategory]);

  void subData; // available for future use

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
    doc.text(doc.splitTextToSize(report.collective_summary, 180), 14, 47);

    autoTable(doc, {
      startY: 65,
      head: [["KPI", "Value"]],
      body: [
        ["Total Processed",  String(totalProcessed)],
        ["Complaints",       `${complaintPct}% (${complaintCount})`],
        ["Inquiries",        String(totalProcessed - complaintCount)],
        ["Mapped Correctly", `${(mappingAccuracyProcessed * 100).toFixed(1)}%`],
      ],
      theme: "grid",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.text("Top categories", 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Category", "Count"]],
      body: categoryData.map((c) => [c.name, String(c.value)]),
      theme: "striped",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.text("Top issues", 14, (doc as any).lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Issue", "Count"]],
      body: issuesData.map((i) => [i.name, String(i.value)]),
      theme: "striped",
      headStyles: { fillColor: [180, 30, 30] },
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.text("Key Insights", 14, 20);
    doc.setFontSize(10);
    report.insights.forEach((ins, i) => {
      doc.text(doc.splitTextToSize(`• ${ins}`, 180), 14, 30 + i * 10);
    });

    doc.save("customer-intelligence-report.pdf");
  };

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalProcessed} messages processed · {(mappingAccuracyProcessed * 100).toFixed(0)}% mapping accuracy
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/upload"><Upload className="mr-2 h-3.5 w-3.5" />New file</Link>
          </Button>
          <Button onClick={exportPDF} size="sm" className="bg-primary hover:bg-primary/90">
            <FileText className="mr-2 h-3.5 w-3.5" />PDF report
          </Button>
        </div>
      </div>

      {/* Input breakdown strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground">{totalInput} rows uploaded</span>
        <span className="text-muted-foreground">→</span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {totalProcessed} Total
        </span>
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {complaintCount} complaints
        </span>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {inquiryCount} inquiries
        </span>
        {statementCount > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {statementCount} statements
          </span>
        )}
        {failedCount > 0 && (
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
            ⚠ {failedCount} failed
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KPICard label="Total Processed" value={totalProcessed} hint="complaints & inquiries" index={0} />
        <KPICard
          label="Complaints"
          value={`${complaintPct}%`}
          hint={`${complaintCount} complaints · ${totalProcessed - complaintCount} inquiries`}
          tone="danger"
          index={1}
        />
        <KPICard
          label="Mapped Correctly"
          value={`${(mappingAccuracyProcessed * 100).toFixed(0)}%`}
          hint={`${mappedProcessed} of ${totalProcessed} matched taxonomy`}
          tone="success"
          index={2}
        />
      </div>

      {/* Insights banner placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 overflow-hidden rounded-2xl border bg-gradient-card p-6 shadow-card"
      />

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">

        {messageTypeData.length > 0 && (
          <SectionCard title="Message Type Distribution">
            <CategoryBar
              data={messageTypeData}
              xLabel="Message Type"
              yLabel="Count"
              colorMap={MESSAGE_TYPE_COLORS}
            />
          </SectionCard>
        )}

        {sentimentData.length > 0 && (
          <SectionCard title="Sentiment Distribution">
            <SentimentPie data={sentimentData} colorMap={SENTIMENT_COLORS} />
          </SectionCard>
        )}

        {categoryData.length > 0 && (
          <SectionCard title="Category Distribution">
            <CategoryBar
              data={categoryData}
              xLabel="Category"
              yLabel="Count"
            />
          </SectionCard>
        )}

        {issuesData.length > 0 && (
          <SectionCard title="Top Issues" description="Most frequent issues across all processed messages">
            <CategoryBar
              data={issuesData}
              xLabel="Issue"
              yLabel="Count"
            />
          </SectionCard>
        )}

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
          {processedResults.slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-4 rounded-lg border bg-background p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${messageTypeBadge(r.message_type)}`}>
                    {r.message_type}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sentimentBadge(r.sentiment)}`}>
                    {r.sentiment}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {r.category} › {r.sub_category} · {r.issue}
                  </span>
                </div>
                <p className="mt-1.5 truncate">{r.translated_text}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  RCA: {r.root_cause} · Next step: {Array.isArray(r.next_steps) ? r.next_steps[0] : r.next_steps}
                </p>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                <div>conf. {r.confidence_score.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
