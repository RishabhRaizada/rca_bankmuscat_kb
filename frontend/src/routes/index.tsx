import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, FileSpreadsheet, Globe2, Lock, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Customer Intelligence Platform — Bank Muscat × AIONOS" },
      {
        name: "description",
        content:
          "AI-powered Customer Intelligence Platform for Bank Muscat. Classify complaints, surface root causes, and act on customer insights in real time.",
      },
    ],
  }),
});

const features = [
  { icon: Brain, title: "AI Classification", desc: "Sentiment, category, sub-category and issue tagging across Arabic & English." },
  { icon: Sparkles, title: "Root Cause Analysis", desc: "Map every complaint to a knowledge-base RCA with recommended action." },
  { icon: BarChart3, title: "Executive Dashboard", desc: "Premium analytics with drill-down, trend, and live filtering." },
  { icon: Globe2, title: "Multilingual", desc: "Native handling of Arabic + English customer messages." },
  { icon: Lock, title: "Bank-Grade Security", desc: "Designed for regulated financial institutions and PII safety." },
  { icon: FileSpreadsheet, title: "Excel & PDF Export", desc: "One-click executive reports for CXO distribution." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              CI
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Customer Intelligence</div>
              <div className="text-[11px] text-muted-foreground">Bank Muscat × AIONOS</div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link to="/dashboard">View dashboard</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
              <Link to="/upload">
                Launch platform <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[480px] bg-gradient-subtle" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Powered by AIONOS · Built for Bank Muscat
            </span>
            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
              AI-powered <span className="text-primary">Customer Intelligence</span> for modern banking
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Ingest customer messages in Arabic or English. In seconds, surface sentiment, root causes,
              and the next best action — at scale, with bank-grade accuracy.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-primary px-6 hover:bg-primary/90 shadow-elegant">
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" /> Upload your data
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">
                  Explore live demo <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs text-muted-foreground">
              <span>✓ CSV & Excel ingestion</span>
              <span>✓ Arabic + English NLU</span>
              <span>✓ Drill-down analytics</span>
              <span>✓ PDF executive reports</span>
            </div>
          </motion.div>

          {/* Floating preview card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="relative mx-auto mt-16 max-w-5xl rounded-2xl border bg-card p-2 shadow-elegant"
          >
            <div className="rounded-xl bg-gradient-card p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { l: "Total messages", v: "20" },
                  { l: "Mapping accuracy", v: "95%" },
                  { l: "Negative sentiment", v: "25%" },
                  { l: "Top category", v: "Cards" },
                ].map((k, i) => (
                  <div key={i} className="rounded-xl border bg-background p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.l}</div>
                    <div className="mt-1 text-2xl font-semibold">{k.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-5 gap-1 px-1">
                {[60, 90, 40, 75, 55].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: h }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.6 }}
                    className="rounded-md bg-primary/80"
                    style={{ height: h }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Capabilities</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to understand your customers
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete intelligence stack — from ingestion to executive reporting — calibrated for retail and corporate banking.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group rounded-2xl border bg-card p-6 shadow-card transition-shadow hover:shadow-elegant"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-y bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Workflow</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                From raw message to executive insight in seconds
              </h2>
              <ol className="mt-8 space-y-5">
                {[
                  ["Upload", "Drop a CSV or Excel file — schema auto-detected."],
                  ["Classify", "Sentiment, category, sub-category and issue tagging."],
                  ["Diagnose", "Root cause analysis mapped from the knowledge base."],
                  ["Act", "Recommended actions and exportable executive reports."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{t}</div>
                      <div className="text-sm text-muted-foreground">{d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-elegant">
              <div className="space-y-3">
                {[
                  { tag: "Complaint", color: "bg-destructive/10 text-destructive", text: "My card payment was rejected" },
                  { tag: "Question", color: "bg-info/10 text-info", text: "Where do I find the card PIN?" },
                  { tag: "Complaint", color: "bg-destructive/10 text-destructive", text: "Funds were not deposited into the recipient's account." },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.color}`}>{m.tag}</span>
                      <span className="text-[11px] text-muted-foreground">conf. 0.85</span>
                    </div>
                    <p className="mt-2 text-sm">{m.text}</p>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Cards › Debit Card · RCA: <span className="text-foreground">Human Error</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center shadow-elegant">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
            See your customer voice — in one intelligence layer
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Try the live demo with sample Bank Muscat data, or upload your own file.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/dashboard">Open live demo</Link>
            </Button>
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" /> Upload data
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-center gap-8 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} AIONOS — built for Bank Muscat</span>
        </div>
      </section>
    </div>
  );
}
