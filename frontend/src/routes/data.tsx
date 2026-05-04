import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Clipboard, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis } from "@/lib/cip/store";
import type { AnalysisPayload, AnalysisResult } from "@/lib/cip/types";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const Route = createFileRoute("/data")({
  component: DataPage,
  head: () => ({ meta: [{ title: "Data — Customer Intelligence" }] }),
});

const ALL_COLUMNS = [
  { key: "original_text", label: "Original Message" },
  { key: "translated_text", label: "Message" },
  { key: "message_type", label: "Type" },
  { key: "sentiment", label: "Sentiment" },
  { key: "category", label: "Category" },
  { key: "sub_category", label: "Sub-category" },
  { key: "issue", label: "Issue" },
  { key: "root_cause", label: "RootCause Tag" },
  { key: "confidence_score", label: "Conf." },
] as const;

function buildRowText(r: AnalysisResult): string {
  const block = (label: string, value: string) =>
    value?.trim() ? `${label}\n${value.trim()}` : "";
  const inline = (label: string, value: string | number | boolean) =>
    value !== "" && value !== undefined && value !== null ? `${label}: ${value}` : "";
  return [
    block("Original Message:", r.original_text),
    block("Translated Message:", r.translated_text),
    "---",
    inline("Type:", r.message_type),
    inline("Sentiment:", r.sentiment),
    inline("Mapped:", r.is_mapped ? "Yes" : "No"),
    inline("Confidence:", typeof r.confidence_score === "number" ? r.confidence_score.toFixed(2) : r.confidence_score),
    "---",
    inline("Category:", r.category),
    inline("Sub-category:", r.sub_category),
    inline("Issue:", r.issue),
    "---",
    block("RootCause Tag:", r.root_cause),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function DataPage() {

  const [data, setData] = useState<AnalysisPayload>(sampleAnalysis);
  const [search, setSearch] = useState("");
  const [wrapText, setWrapText] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [sentiment, setSentiment] = useState<string>("");
  const [issue, setIssue] = useState<string>("");
  const [sortKey, setSortKey] = useState<keyof AnalysisResult>("confidence_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState<string[]>(ALL_COLUMNS.map((c) => c.key));
  const pageSize = 15;
  const handleExport = () => {
    const rows = data.results.filter((row) => row.message_type !== "Statement" && row.message_type !== "Unclassified").map((row) => {
      const out: Record<string, unknown> = {};
      for (const col of ALL_COLUMNS) {
        const val = (row as unknown as Record<string, unknown>)[col.key];
        out[col.label] = Array.isArray(val) ? val.join(" · ") : (val ?? "");
      }
      return out;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ALL_COLUMNS.map((c) => c.label),
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Data");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "all_analysis_data.xlsx",
    );
  };
  useEffect(() => {
    const s = loadAnalysis();
    if (s) setData(s);
  }, []);

  const categories = useMemo(() => Array.from(new Set(data.results.map((r) => r.category))).sort(), [data.results]);
  const sentiments = useMemo(() => Array.from(new Set(data.results.map((r) => r.sentiment))).sort(), [data.results]);
  const issues = useMemo(() => Array.from(new Set(data.results.map((r) => r.issue))).sort(), [data.results]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.results
      .filter((r) => r.message_type !== "Statement" && r.message_type !== "Unclassified")
      .filter((r) => !category || r.category === category)
      .filter((r) => !sentiment || r.sentiment === sentiment)
      .filter((r) => !issue || r.issue === issue)
      .filter((r) =>
        !q ||
        r.translated_text.toLowerCase().includes(q) ||
        r.original_text.toLowerCase().includes(q) ||
        r.root_cause.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
  }, [data.results, search, category, sentiment, issue, sortKey, sortDir]);

  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const toggleSort = (k: keyof AnalysisResult) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const copyRow = (r: AnalysisResult, idx: number) => {
    navigator.clipboard.writeText(buildRowText(r)).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Data explorer</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {data.results.length} records</p>
      </div>

      <SectionCard
        title="Filters"
        description="Search messages and narrow by category, sentiment or issue"
        action={
          <div className="flex items-center gap-2">
            
            {/* ✅ Download Button */}
            <Button onClick={handleExport}>
              Download Excel
            </Button>

            {/* Existing Columns dropdown */}
            <details className="relative">
              <summary className="flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Columns
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border bg-popover p-2 shadow-elegant">
                {ALL_COLUMNS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={visible.includes(c.key)}
                      onChange={(e) =>
                        setVisible((v) =>
                          e.target.checked
                            ? [...v, c.key]
                            : v.filter((x) => x !== c.key)
                        )
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </details>

          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={wrapText}
              onChange={(e) => setWrapText(e.target.checked)}
            />
            <span className="text-sm">Wrap Text</span>
          </div>
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search messages…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <select value={category} onChange={(e)=>{setCategory(e.target.value);setPage(0);}} className="rounded-md border bg-background px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sentiment} onChange={(e)=>{setSentiment(e.target.value);setPage(0);}} className="rounded-md border bg-background px-3 text-sm">
            <option value="">All sentiments</option>
            {sentiments.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={issue} onChange={(e)=>{setIssue(e.target.value);setPage(0);}} className="rounded-md border bg-background px-3 text-sm">
            <option value="">All issues</option>
            {issues.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </SectionCard>

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {ALL_COLUMNS.filter((c) => visible.includes(c.key)).map((c) => (
                  <th key={c.key} className="px-3 py-3 text-left font-medium">
                    <button onClick={() => toggleSort(c.key as keyof AnalysisResult)} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.label}
                      {sortKey === c.key && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  </th>
                ))}
                <th className="w-8 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={visible.length + 1} className="p-12 text-center text-muted-foreground">
                    No records match your filters.
                  </td>
                </tr>
              ) : pageData.map((r, i) => (
                <tr key={i} className="group border-t hover:bg-muted/20">

                  {/* 🔥 1. ORIGINAL TEXT */}
                  {visible.includes("original_text") && (
                    <td
                      title={r.original_text}
                      className={`px-3 py-2.5 max-w-[320px] ${
                        wrapText ? "whitespace-normal break-words" : "truncate"
                      }`}
                    >
                      {r.original_text}
                    </td>
                  )}

                  {/* 🔥 2. TRANSLATED TEXT */}
                  {visible.includes("translated_text") && (
                    <td
                      title={r.translated_text}
                      className={`px-3 py-2.5 max-w-[320px] ${
                        wrapText ? "whitespace-normal break-words" : "truncate"
                      }`}
                    >
                      {r.translated_text}
                    </td>
                  )}

                  {/* 🔥 3. MESSAGE TYPE */}
                  {visible.includes("message_type") && (
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        r.message_type === "Complaint" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info",
                      )}>
                        {r.message_type}
                      </span>
                    </td>
                  )}

                  {/* 🔥 4. SENTIMENT */}
                  {visible.includes("sentiment") && (
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        r.sentiment === "Negative" ? "bg-destructive/10 text-destructive" :
                        r.sentiment === "Positive" ? "bg-success/10 text-success" :
                        "bg-muted text-muted-foreground",
                      )}>
                        {r.sentiment}
                      </span>
                    </td>
                  )}

                  {/* 🔥 5. CATEGORY — red when LLM-suggested (is_mapped=false) */}
                  {visible.includes("category") && (
                    <td className={cn("px-3 py-2.5", !r.is_mapped && "text-destructive")}>
                      {r.category}
                    </td>
                  )}

                  {/* 🔥 6. SUB CATEGORY — red when LLM-suggested */}
                  {visible.includes("sub_category") && (
                    <td className={cn("px-3 py-2.5", !r.is_mapped ? "text-destructive" : "text-muted-foreground")}>
                      {r.sub_category}
                    </td>
                  )}

                  {/* 🔥 7. ISSUE — red when LLM-suggested */}
                  {visible.includes("issue") && (
                    <td className={cn("px-3 py-2.5", !r.is_mapped ? "text-destructive" : "text-muted-foreground")}>
                      {r.issue}
                    </td>
                  )}

                  {/* 🔥 8. ROOT CAUSE */}
                  {visible.includes("root_cause") && (
                    <td className="px-3 py-2.5 text-muted-foreground max-w-[260px] truncate" title={r.root_cause}>{r.root_cause}</td>
                  )}

                  {/* 🔥 9. CONFIDENCE */}
                  {visible.includes("confidence_score") && (
                    <td className="px-3 py-2.5 tabular-nums">
                      {r.confidence_score.toFixed(2)}
                    </td>
                  )}

                  {/* Copy button */}
                  <td className="w-8 px-2 py-2.5 align-top">
                    <button
                      onClick={() => copyRow(r, i)}
                      title="Copy row"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      {copiedIdx === i
                        ? <Check className="h-3.5 w-3.5 text-success" />
                        : <Clipboard className="h-3.5 w-3.5" />}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
          <div>Page {page + 1} of {totalPages}</div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
