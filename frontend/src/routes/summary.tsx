import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock,
  Rocket,
  Gauge,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis, loadSummary, saveSummary, clearSummary } from "@/lib/cip/store";
import { summarizeClusters } from "@/lib/cip/api";
import type { AnalysisPayload, AnalysisResult, ClusterSummary } from "@/lib/cip/types";
import type { Action } from "@/lib/cip/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/summary")({
  component: SummaryPage,
  head: () => ({ meta: [{ title: "Insights — Customer Intelligence" }] }),
});

// ─── Section colour tokens ───────────────────────────────────────────────────
const SECTION_STYLES = {
  exec:       { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", icon: "text-violet-600 dark:text-violet-400" },
  deep:       { bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-slate-200 dark:border-slate-700", icon: "text-slate-600 dark:text-slate-400" },
  short_term: { bg: "bg-blue-50 dark:bg-blue-950/30",   border: "border-blue-200 dark:border-blue-800",   icon: "text-blue-600 dark:text-blue-400"   },
  strategic:  { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", icon: "text-violet-600 dark:text-violet-400" },
} as const;

const SEVERITY_STYLES: Record<string, { badge: string; bar: string }> = {
  Critical: { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300",    bar: "bg-red-500"    },
  High:     { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300", bar: "bg-orange-500" },
  Medium:   { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300",   bar: "bg-amber-500"  },
  Low:      { badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-300",   bar: "bg-green-500"  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function BulletList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground italic">None identified.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", color.replace("text-", "bg-"))} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionBlock({
  icon: Icon,
  title,
  style,
  children,
}: {
  icon: React.ElementType;
  title: string;
  style: (typeof SECTION_STYLES)[keyof typeof SECTION_STYLES];
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border p-4", style.bg, style.border)}>
      <div className={cn("mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", style.icon)}>
        <Icon className="h-4 w-4" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ActionList({ items }: { items: Action[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground italic">None identified.</p>;
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          <span className="shrink-0 w-5 text-right text-xs font-semibold opacity-50 mt-0.5">{i + 1}.</span>
          <span className="flex-1 leading-relaxed">{item.action}</span>
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
            {item.owner}
          </span>
        </li>
      ))}
    </ol>
  );
}

// ─── Numbered prose renderer ─────────────────────────────────────────────────
function NumberedText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);

  let items: string[];
  if (lines.length > 1) {
    items = lines.map((l) => l.replace(/^[\d]+\.\s*|^[•\-*]\s*/, "").trim()).filter(Boolean);
  } else {
    const raw = text.split(/\.\s+/).map((s) => s.trim()).filter(Boolean);
    items = raw.map((s, i) => (i < raw.length - 1 ? s + "." : s));
  }

  if (items.length <= 1) {
    return <p className={cn("text-sm leading-relaxed", className)}>{text}</p>;
  }

  return (
    <ol className={cn("space-y-2 text-sm", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="shrink-0 w-5 text-right text-xs font-semibold opacity-50 mt-0.5">{i + 1}.</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Cluster detail panel ────────────────────────────────────────────────────
function ClusterReport({ cluster }: { cluster: ClusterSummary }) {
  const sev = SEVERITY_STYLES[cluster.severity_tier] ?? SEVERITY_STYLES.Medium;

  return (
    <motion.div
      key={cluster.category}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* Severity tier banner */}
      <div className={cn("flex items-start gap-3 rounded-xl border p-3", sev.badge)}>
        <Gauge className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider">Severity: {cluster.severity_tier}</span>
          <p className="mt-0.5 text-xs leading-relaxed opacity-80">{cluster.severity_justification}</p>
        </div>
      </div>

      {/* 1 · Executive Summary */}
      <SectionBlock icon={Sparkles} title="1 · Executive Summary" style={SECTION_STYLES.exec}>
        <NumberedText text={cluster.executive_summary} />
      </SectionBlock>

      {/* 2 · Root Cause Analysis */}
      <SectionBlock icon={TrendingUp} title="2 · Root Cause Analysis" style={SECTION_STYLES.deep}>
        <NumberedText text={cluster.deep_analysis} />
      </SectionBlock>

      {/* 3 · Short-term Actions */}
      <SectionBlock icon={Clock} title="3 · Short-term Actions — 1–3 months" style={SECTION_STYLES.short_term}>
        <ActionList items={cluster.short_term_actions.slice(0, 3)} />
      </SectionBlock>

      {/* 4 · Strategic Actions */}
      <SectionBlock icon={Rocket} title="4 · Strategic Actions — 3–12 months" style={SECTION_STYLES.strategic}>
        <ActionList items={cluster.strategic_actions.slice(0, 3)} />
      </SectionBlock>
    </motion.div>
  );
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function buildTextReport(clusters: ClusterSummary[], messages: AnalysisResult[]): string {
  const line = (ch: string, n = 72) => ch.repeat(n);
  const sections: string[] = [];

  sections.push(line("="));
  sections.push("CUSTOMER INTELLIGENCE PLATFORM");
  sections.push("Cluster Analysis Report");
  sections.push(`Generated: ${new Date().toLocaleString()}`);
  sections.push(line("="));
  sections.push("");

  clusters.forEach((c, idx) => {
    sections.push(line("-"));
    sections.push(`CLUSTER ${idx + 1}: ${c.category.toUpperCase()}  (${c.count} messages)`);
    const types = Object.entries(c.message_type_counts).map(([t, n]) => `${n} ${t}`).join(", ");
    sections.push(`Message types: ${types}`);
    sections.push(`Severity: ${c.severity_tier} — ${c.severity_justification}`);
    sections.push(line("-"));
    sections.push("");

    sections.push("1. EXECUTIVE SUMMARY");
    sections.push(c.executive_summary);
    sections.push("");

    sections.push("2. ROOT CAUSE ANALYSIS");
    sections.push(c.deep_analysis);
    sections.push("");

    sections.push("3. SHORT-TERM ACTIONS (1–3 months)");
    c.short_term_actions.slice(0, 3).forEach((a) => sections.push(`  • [${a.owner}] ${a.action}`));
    sections.push("");

    sections.push("4. STRATEGIC ACTIONS (3–12 months)");
    c.strategic_actions.slice(0, 3).forEach((a) => sections.push(`  • [${a.owner}] ${a.action}`));
    sections.push("");

    const clusterMsgs = messages.filter(
      (r) => r.category === c.category && r.message_type !== "Statement",
    );
    if (clusterMsgs.length > 0) {
      sections.push(`5. MESSAGES (${clusterMsgs.length} total)`);
      clusterMsgs.forEach((r, mi) => {
        sections.push(`  [${mi + 1}] Original:  ${r.original_text}`);
        sections.push(`       Message:   ${r.translated_text}`);
        sections.push(`       Sentiment: ${r.sentiment}`);
        sections.push(`       Issue:     ${r.issue}`);
      });
      sections.push("");
    }

    sections.push("");
  });

  return sections.join("\n");
}

function downloadText(clusters: ClusterSummary[], messages: AnalysisResult[]) {
  const text = buildTextReport(clusters, messages);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `cluster-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(cluster: ClusterSummary, messages: AnalysisResult[]) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryRows = [
    { Field: "Category",          Value: cluster.category },
    { Field: "Total Messages",    Value: cluster.count },
    { Field: "Severity",          Value: cluster.severity_tier },
    { Field: "Severity Note",     Value: cluster.severity_justification },
    { Field: "Executive Summary", Value: cluster.executive_summary },
    { Field: "Root Cause Analysis", Value: cluster.deep_analysis },
    ...cluster.short_term_actions.slice(0, 3).map((a, i) => ({
      Field: `Short-term Action ${i + 1}`,
      Value: `[${a.owner}] ${a.action}`,
    })),
    ...cluster.strategic_actions.slice(0, 3).map((a, i) => ({
      Field: `Strategic Action ${i + 1}`,
      Value: `[${a.owner}] ${a.action}`,
    })),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");

  // Sheet 2: Messages
  const msgRows = messages
    .filter((r) => r.message_type !== "Statement")
    .map((r) => ({
      "Original (Arabic)": r.original_text,
      "Message (English)": r.translated_text,
      "Sentiment":         r.sentiment,
      "Issue":             r.issue,
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(msgRows), "Messages");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${cluster.category}-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}

function downloadPDF(clusters: ClusterSummary[]) {
  const doc    = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW     = 210;
  const MARGIN = 14;
  const CW     = PW - MARGIN * 2;
  const RED: [number, number, number]   = [180, 30,  30];
  const DARK: [number, number, number]  = [30,  30,  40];
  const GREY: [number, number, number]  = [100, 100, 110];
  const LGREY: [number, number, number] = [240, 240, 244];

  // ── Cover page ────────────────────────────────────────────────────────────
  doc.setFillColor(...RED);
  doc.rect(0, 0, PW, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Intelligence Platform", MARGIN, 28);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Cluster Analysis Report", MARGIN, 38);
  doc.setFontSize(10);
  doc.text(`Bank Muscat × AIONOS  ·  Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, MARGIN, 50);

  // Table of contents
  doc.setTextColor(...DARK);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Clusters Covered", MARGIN, 76);

  autoTable(doc, {
    startY: 80,
    margin: { left: MARGIN, right: MARGIN },
    head: [["#", "Category", "Messages", "Types"]],
    body: clusters.map((c, i) => [
      String(i + 1),
      c.category,
      String(c.count),
      Object.entries(c.message_type_counts).map(([t, n]) => `${n} ${t}`).join(", "),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: LGREY },
    columnStyles: { 0: { cellWidth: 10 }, 2: { cellWidth: 22, halign: "center" } },
  });

  // ── Per-cluster pages ─────────────────────────────────────────────────────
  clusters.forEach((c, idx) => {
    doc.addPage();

    // Cluster header bar
    doc.setFillColor(...RED);
    doc.rect(0, 0, PW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${c.category}`, MARGIN, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const typeStr = Object.entries(c.message_type_counts).map(([t, n]) => `${n} ${t}`).join("  ·  ");
    doc.text(`${c.count} messages  ·  ${typeStr}`, PW - MARGIN, 12, { align: "right" });

    let y = 26;

    const addHeading = (num: string, title: string, color: [number, number, number] = DARK) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(...color);
      doc.rect(MARGIN, y, CW, 7, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${num}  ${title.toUpperCase()}`, MARGIN + 3, y + 5);
      y += 10;
    };

    const addParagraph = (text: string) => {
      if (!text) return;
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, CW);
      lines.forEach((line: string) => {
        if (y > 272) { doc.addPage(); y = 20; }
        doc.text(line, MARGIN, y);
        y += 5;
      });
      y += 3;
    };

    const addBullets = (items: string[], color: [number, number, number] = RED) => {
      if (!items.length) { addParagraph("None identified."); return; }
      items.forEach((item) => {
        const lines = doc.splitTextToSize(item, CW - 6);
        lines.forEach((line: string, li: number) => {
          if (y > 272) { doc.addPage(); y = 20; }
          if (li === 0) {
            doc.setFillColor(...color);
            doc.circle(MARGIN + 1.5, y - 1, 1, "F");
            doc.setTextColor(...DARK);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(line, MARGIN + 5, y);
          } else {
            doc.text(line, MARGIN + 5, y);
          }
          y += 5;
        });
      });
      y += 2;
    };

    // Sections
    addHeading("1", "Executive Summary");
    addParagraph(c.executive_summary);

    addHeading("2", "Root Cause Analysis", [40, 40, 100]);
    addParagraph(c.deep_analysis);

    // Severity tier
    const sevColors: Record<string, [number,number,number]> = {
      Critical: [180, 30, 30], High: [200, 90, 20], Medium: [160, 120, 10], Low: [30, 120, 60],
    };
    const sevColor = sevColors[c.severity_tier] ?? sevColors.Medium;
    addHeading("", `Severity: ${c.severity_tier}`, sevColor);
    addParagraph(c.severity_justification);

    const addActions = (items: { action: string; owner: string }[]) => {
      if (!items.length) { addParagraph("None identified."); return; }
      items.forEach((item) => {
        const label = `[${item.owner}]`;
        const lines = doc.splitTextToSize(`${label} ${item.action}`, CW - 6);
        lines.forEach((line: string, li: number) => {
          if (y > 272) { doc.addPage(); y = 20; }
          if (li === 0) {
            doc.setFillColor(...DARK);
            doc.circle(MARGIN + 1.5, y - 1, 1, "F");
          }
          doc.setTextColor(...DARK);
          doc.setFont("helvetica", li === 0 ? "bold" : "normal");
          doc.setFontSize(9);
          doc.text(line, MARGIN + 5, y);
          y += 5;
        });
      });
      y += 2;
    };

    addHeading("3", "Short-term Actions — 1–3 months", [30, 80, 160]);
    addActions(c.short_term_actions.slice(0, 3));

    addHeading("4", "Strategic Actions — 3–12 months", [80, 40, 140]);
    addActions(c.strategic_actions.slice(0, 3));

    // Footer rule
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 287, PW - MARGIN, 287);
    doc.setTextColor(...GREY);
    doc.setFontSize(7);
    doc.text(`Customer Intelligence Platform  ·  Bank Muscat × AIONOS  ·  Page ${doc.getNumberOfPages()}`, PW / 2, 292, { align: "center" });
  });

  doc.save(`cluster-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Main page ───────────────────────────────────────────────────────────────
function SummaryPage() {
  const [data, setData]           = useState<AnalysisPayload>(sampleAnalysis);
  const [clusters, setClusters]   = useState<ClusterSummary[]>([]);
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    const s = loadAnalysis();
    if (s) setData(s);
    // Restore previously generated summary for this session
    const saved = loadSummary();
    if (saved?.clusters?.length) {
      setClusters(saved.clusters);
      setGenerated(true);
      setSelected(saved.clusters[0].category);
    }
  }, []);

  const categoryGroups = useMemo(() => {
    const map = new Map<string, { count: number; types: Record<string, number> }>();
    const skip = new Set(["statement", "unclassified", ""]);
    data.results.forEach((r) => {
      const cat = (r.category ?? "").trim();
      if (skip.has(cat.toLowerCase())) return;
      const entry = map.get(cat) ?? { count: 0, types: {} };
      entry.count += 1;
      entry.types[r.message_type] = (entry.types[r.message_type] ?? 0) + 1;
      map.set(cat, entry);
    });
    return Array.from(map, ([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [data.results]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await summarizeClusters(data.results);
      setClusters(payload.clusters);
      saveSummary(payload);
      setGenerated(true);
      if (payload.clusters.length > 0) setSelected(payload.clusters[0].category);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    clearSummary();
    setGenerated(false);
    setClusters([]);
    setSelected(null);
  };

  const selectedCluster = clusters.find((c) => c.category === selected) ?? null;

  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => { setShowMessages(false); }, [selected]);

  const clusterMessages = useMemo(() => {
    if (!selectedCluster) return [];
    return data.results.filter(
      (r) => r.category === selectedCluster.category && r.message_type !== "Statement",
    );
  }, [data.results, selectedCluster]);

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">RCA Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryGroups.length} category clusters · {data.results.length} total messages
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!generated && !loading && (
            <Button
              onClick={handleGenerate}
              disabled={categoryGroups.length === 0}
              className="bg-primary hover:bg-primary/90 shadow-elegant"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Generate Full Analysis
            </Button>
          )}
          {generated && (
            <Button variant="ghost" size="sm" onClick={handleRegenerate}>
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Pre-generation: cluster overview */}
      {!generated && !loading && (
        <SectionCard title="Category clusters" description="Groups detected in the uploaded data — click Generate to run AI analysis on each.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryGroups.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground italic">No data loaded yet. Upload a file first.</p>
            ) : categoryGroups.map((g, i) => (
              <motion.div
                key={g.category}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{g.category}</div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{g.count}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(g.types).map(([type, cnt]) => (
                    <span key={type} className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] font-medium",
                      type === "Complaint" ? "bg-destructive/10 text-destructive" :
                      type === "Inquiry"   ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-muted text-muted-foreground",
                    )}>
                      {cnt} {type}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-muted/20 py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-sm font-medium">Running AI analysis on {categoryGroups.length} clusters…</div>
          <div className="text-xs text-muted-foreground">This may take 30–60 seconds depending on data volume.</div>
        </div>
      )}

      {/* Generated: two-panel layout */}
      {generated && !loading && clusters.length > 0 && (
        <div className="flex gap-5">
          {/* Left: cluster list */}
          <div className="w-64 shrink-0 space-y-1.5">
            {clusters.map((c) => {
              const isActive = selected === c.category;
              const sev = SEVERITY_STYLES[c.severity_tier] ?? SEVERITY_STYLES.Medium;
              return (
                <button
                  key={c.category}
                  onClick={() => setSelected(c.category)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all",
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
                      {c.category}
                    </span>
                    <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", sev.badge)}>
                      {c.severity_tier}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(c.message_type_counts).map(([type, cnt]) => (
                      <span key={type} className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        type === "Complaint" ? "bg-destructive/10 text-destructive" :
                        type === "Inquiry"   ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                        "bg-muted text-muted-foreground",
                      )}>
                        {cnt} {type}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: report */}
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {selectedCluster ? (
                <div key={selectedCluster.category}>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{selectedCluster.category}</h2>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <button
                          onClick={() => setShowMessages((v) => !v)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium hover:bg-muted transition-colors"
                        >
                          {clusterMessages.length} messages
                          {showMessages ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                        <span>·</span>
                        <span>
                          {selectedCluster.issues.slice(0, 4).join(", ")}
                          {selectedCluster.issues.length > 4 && ` +${selectedCluster.issues.length - 4} more`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadText([selectedCluster], clusterMessages)}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadExcel(selectedCluster, clusterMessages)}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> Excel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => downloadPDF([selectedCluster])}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
                      </Button>
                    </div>
                  </div>

                  {showMessages && (
                    <div className="mb-4 rounded-xl border bg-card overflow-hidden">
                      <div className="max-h-80 overflow-y-auto overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-muted/90 backdrop-blur text-[10px] uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium w-[220px]">Original (Arabic)</th>
                              <th className="px-3 py-2 text-left font-medium w-[220px]">Message (English)</th>
                              <th className="px-3 py-2 text-left font-medium w-24">Sentiment</th>
                              <th className="px-3 py-2 text-left font-medium">Issue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clusterMessages.map((r, i) => (
                              <tr key={i} className="border-t hover:bg-muted/20 align-top">
                                <td className="px-3 py-2 w-[220px]">
                                  <span title={r.original_text} className="line-clamp-3 leading-relaxed text-right block" dir="rtl">
                                    {r.original_text}
                                  </span>
                                </td>
                                <td className="px-3 py-2 w-[220px]">
                                  <span title={r.translated_text} className="line-clamp-3 leading-relaxed">
                                    {r.translated_text}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                    r.sentiment === "Negative" ? "bg-destructive/10 text-destructive" :
                                    r.sentiment === "Positive" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                    "bg-muted text-muted-foreground",
                                  )}>
                                    {r.sentiment}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground" title={r.issue}>
                                  <span className="line-clamp-3">{r.issue}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <ClusterReport cluster={selectedCluster} />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border bg-muted/20 text-sm text-muted-foreground">
                  Select a category from the left to view its report.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </AppShell>
  );
}
