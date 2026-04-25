import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sampleAnalysis } from "@/lib/cip/sample";
import { loadAnalysis } from "@/lib/cip/store";
import type { AnalysisPayload, AnalysisResult } from "@/lib/cip/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data")({
  component: DataPage,
  head: () => ({ meta: [{ title: "Data — Customer Intelligence" }] }),
});

const ALL_COLUMNS = [
  { key: "message_type", label: "Type" },
  { key: "sentiment", label: "Sentiment" },
  { key: "category", label: "Category" },
  { key: "sub_category", label: "Sub-category" },
  { key: "issue", label: "Issue" },
  { key: "root_cause", label: "Root cause" },
  { key: "recommended_action", label: "Action" },
  { key: "confidence_score", label: "Conf." },
  { key: "source_language", label: "Lang" },
  { key: "translated_text", label: "Message" },
] as const;

function DataPage() {
  const [data, setData] = useState<AnalysisPayload>(sampleAnalysis);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [sentiment, setSentiment] = useState<string>("");
  const [issue, setIssue] = useState<string>("");
  const [sortKey, setSortKey] = useState<keyof AnalysisResult>("confidence_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState<string[]>(ALL_COLUMNS.map((c) => c.key));
  const pageSize = 15;

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
      .filter((r) => !category || r.category === category)
      .filter((r) => !sentiment || r.sentiment === sentiment)
      .filter((r) => !issue || r.issue === issue)
      .filter((r) =>
        !q ||
        r.translated_text.toLowerCase().includes(q) ||
        r.original_text.toLowerCase().includes(q) ||
        r.complaint_summary.toLowerCase().includes(q),
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
                    onChange={(e) => setVisible((v) => e.target.checked ? [...v, c.key] : v.filter((x) => x !== c.key))}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
        }
      >
        <div className="flex flex-wrap gap-3">
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
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={visible.length} className="p-12 text-center text-muted-foreground">No records match your filters.</td></tr>
              ) : pageData.map((r, i) => (
                <tr key={i} className="border-t hover:bg-muted/20">
                  {visible.includes("message_type") && (
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        r.is_complaint ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info",
                      )}>{r.message_type}</span>
                    </td>
                  )}
                  {visible.includes("sentiment") && (
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        r.sentiment === "Negative" ? "bg-destructive/10 text-destructive" :
                        r.sentiment === "Positive" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                      )}>{r.sentiment}</span>
                    </td>
                  )}
                  {visible.includes("category") && <td className="px-3 py-2.5">{r.category}</td>}
                  {visible.includes("sub_category") && <td className="px-3 py-2.5 text-muted-foreground">{r.sub_category}</td>}
                  {visible.includes("issue") && <td className="px-3 py-2.5 text-muted-foreground">{r.issue}</td>}
                  {visible.includes("root_cause") && <td className="px-3 py-2.5 text-muted-foreground">{r.root_cause}</td>}
                  {visible.includes("recommended_action") && <td className="px-3 py-2.5 text-muted-foreground max-w-[220px] truncate">{r.recommended_action}</td>}
                  {visible.includes("confidence_score") && <td className="px-3 py-2.5 tabular-nums">{r.confidence_score.toFixed(2)}</td>}
                  {visible.includes("source_language") && <td className="px-3 py-2.5 text-muted-foreground">{r.source_language}</td>}
                  {visible.includes("translated_text") && <td className="px-3 py-2.5 max-w-[320px] truncate">{r.translated_text}</td>}
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
