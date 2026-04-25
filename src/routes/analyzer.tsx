import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { SectionCard } from "@/components/app/SectionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeText } from "@/lib/cip/mock-engine";
import type { AnalysisResult } from "@/lib/cip/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyzer")({
  component: AnalyzerPage,
  head: () => ({ meta: [{ title: "Analyzer — Customer Intelligence" }] }),
});

const SAMPLES = [
  "My card payment was rejected at the merchant terminal yesterday.",
  "Where do I find the card PIN in the mobile app?",
  "The funds I transferred this morning have not been credited to the recipient.",
  "هل يمكنني الحصول على بطاقة ثانية لابنتي؟",
];

function AnalyzerPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 700));
    setResult(analyzeText(text.trim()));
    setLoading(false);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Single message analyzer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste any customer message in Arabic or English to get instant classification.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Input" description="Paste a customer message">
          <Textarea
            rows={8}
            placeholder="e.g. My card was declined at the ATM yesterday…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className="rounded-full border bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  {s.length > 40 ? s.slice(0, 40) + "…" : s}
                </button>
              ))}
            </div>
            <Button onClick={run} disabled={!text.trim() || loading} className="bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="AI Output" description="Real-time classification, RCA and recommended action">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Running classification…</span>
              </motion.div>
            ) : !result ? (
              <motion.div key="e" initial={{opacity:0}} animate={{opacity:1}} className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Sparkles className="h-6 w-6 text-primary/60" />
                <p className="text-sm">Output will appear here.</p>
              </motion.div>
            ) : (
              <motion.div key="r" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium",
                    result.is_complaint ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"
                  )}>{result.message_type}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium",
                    result.sentiment === "Negative" ? "bg-destructive/10 text-destructive" :
                    result.sentiment === "Positive" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                  )}>{result.sentiment}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Conf. {result.confidence_score.toFixed(2)}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{result.source_language}</span>
                </div>
                <Field label="Category" value={`${result.category} › ${result.sub_category}`} />
                <Field label="Issue" value={result.issue} />
                <Field label="Root cause" value={result.root_cause} accent />
                <Field label="Recommended action" value={result.recommended_action} accent />
                <Field label="Translated text" value={result.translated_text} />
              </motion.div>
            )}
          </AnimatePresence>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", accent ? "border-primary/20 bg-primary/5" : "bg-background")}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm", accent && "text-foreground font-medium")}>{value}</div>
    </div>
  );
}
