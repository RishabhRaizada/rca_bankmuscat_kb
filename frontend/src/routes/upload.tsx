import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { CloudUpload, FileSpreadsheet, Loader2, CheckCircle2, X, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sampleAnalysis } from "@/lib/cip/sample";
import { saveAnalysis } from "@/lib/cip/store";
import { processFile } from "@/lib/cip/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
  head: () => ({ meta: [{ title: "Upload — Customer Intelligence" }] }),
});

const TEXT_KEYS = ["complaint_text", "message", "text", "complaint", "feedback", "comment", "description"];

function detectTextColumn(headers: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const k of TEXT_KEYS) {
    const idx = lower.indexOf(k);
    if (idx >= 0) return headers[idx];
  }
  // fallback: longest avg string column — choose first non-id text column
  return headers.find((h) => !/^id$|date|time|user|customer/i.test(h)) ?? headers[0] ?? null;
}

type Step = { label: string; status: "pending" | "active" | "done" };

function UploadPage() {
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [textCol, setTextCol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { label: "Uploading file", status: "pending" },
    { label: "Parsing & schema detection", status: "pending" },
    { label: "AI classification", status: "pending" },
    { label: "RCA mapping & insights", status: "pending" },
  ]);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setFile(f);
    if (f.size > 20 * 1024 * 1024) {
      setError("File too large. Maximum 20MB.");
      return;
    }
    const ext = f.name.toLowerCase().split(".").pop();
    try {
      if (ext === "csv") {
        const text = await f.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true });
        const hs = parsed.meta.fields ?? [];
        setHeaders(hs);
        setTotalRows(parsed.data.length);
        setRows(parsed.data.slice(0, 10));
        setTextCol(detectTextColumn(hs));
        // store full rows on the file element via data attr is wasteful; re-parse on submit
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
        const hs = Object.keys(json[0] ?? {});
        setHeaders(hs);
        setTotalRows(json.length);
        setRows(json.slice(0, 10));
        setTextCol(detectTextColumn(hs));
      } else {
        setError("Unsupported format. Use .csv, .xlsx or .xls");
      }
    } catch (e) {
      setError(`Failed to parse file: ${(e as Error).message}`);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) void handleFile(f);
  };

  const advance = (i: number) =>
    setSteps((s) => s.map((step, idx) => ({ ...step, status: idx < i ? "done" : idx === i ? "active" : "pending" })));

  const process = async () => {
    if (!file) {
      // Use sample data — no backend call needed
      setProcessing(true);
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i);
        if (i === 10) advance(1);
        if (i === 35) advance(2);
        if (i === 70) advance(3);
        await new Promise((r) => setTimeout(r, 60));
      }
      advance(4);
      saveAnalysis(sampleAnalysis);
      setTimeout(() => nav({ to: "/dashboard" }), 400);
      return;
    }

    setProcessing(true);
    setError(null);
    advance(0);
    setProgress(8);

    // Animate through the first stages while the backend processes the file
    let cancelled = false;
    const animate = async () => {
      const stages = [
        { p: 25, step: 1, ms: 400 },
        { p: 55, step: 2, ms: 700 },
        { p: 85, step: 3, ms: 900 },
      ];
      for (const s of stages) {
        if (cancelled) return;
        advance(s.step);
        const start = s.p - 20;
        const target = s.p;
        const t0 = Date.now();
        while (!cancelled && Date.now() - t0 < s.ms) {
          const pct = start + ((target - start) * (Date.now() - t0)) / s.ms;
          setProgress(pct);
          await new Promise((r) => setTimeout(r, 40));
        }
        setProgress(target);
      }
    };

    try {
      const [payload] = await Promise.all([processFile(file), animate()]);
      cancelled = true;
      saveAnalysis(payload);
      setProgress(100);
      advance(4);
      setTimeout(() => nav({ to: "/dashboard" }), 500);
    } catch (e) {
      cancelled = true;
      setProcessing(false);
      setProgress(0);
      setSteps((s) => s.map((step) => ({ ...step, status: "pending" })));
      setError(
        `${(e as Error).message}. Make sure the backend is running at the configured API URL (default http://localhost:8000).`,
      );
    }
  };

  const reset = () => {
    setFile(null);
    setRows([]);
    setTotalRows(0);
    setHeaders([]);
    setTextCol(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Upload customer messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV or Excel. We auto-detect the message column and run classification + RCA.
          </p>
        </div>

        <SectionCard title="1. File" description="Drag & drop a file or browse. Up to 20MB.">
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-16 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <CloudUpload className="h-7 w-7" />
              </div>
              <div className="mt-4 text-sm font-medium">Drop file here, or click to browse</div>
              <div className="mt-1 text-xs text-muted-foreground">Supports .csv, .xlsx, .xls</div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <div className="mt-6 flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void process(); }}
                  className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  or run with sample data →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB · {totalRows > 0 ? `${totalRows.toLocaleString()} rows · ${headers.length} columns` : "Parsing…"}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {error && <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </SectionCard>

        {rows.length > 0 && (
          <SectionCard
            title="2. Schema preview"
            description={`Showing first ${rows.length} rows. Detected text column: ${textCol ?? "—"}`}
            action={
              <select
                value={textCol ?? ""}
                onChange={(e) => setTextCol(e.target.value)}
                className="rounded-md border bg-background px-3 py-1.5 text-xs"
              >
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            }
          >
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className={cn("px-3 py-2 text-left font-medium", h === textCol && "text-primary")}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      {headers.map((h) => (
                        <td key={h} className={cn("max-w-[260px] truncate px-3 py-2", h === textCol && "text-foreground")}>
                          {String(r[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {(rows.length > 0 || processing) && (
          <SectionCard title="3. Process" description="Run AI classification, sentiment and RCA mapping.">
            <AnimatePresence mode="wait">
              {!processing ? (
                <motion.div key="idle" exit={{ opacity: 0 }} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Ready to process <strong>{rows.length > 0 ? "your file" : "sample data"}</strong>.
                  </p>
                  <Button onClick={process} className="bg-primary hover:bg-primary/90 shadow-elegant">
                    <Sparkles className="mr-2 h-4 w-4" /> Process file
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <Progress value={progress} className="h-2" />
                  <ul className="space-y-2.5">
                    {steps.map((s, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        {s.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : s.status === "active" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border" />
                        )}
                        <span className={s.status === "pending" ? "text-muted-foreground" : ""}>{s.label}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        )}
      </div>
    </AppShell>
  );
}
