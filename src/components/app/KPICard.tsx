import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  index?: number;
}

const toneCls: Record<NonNullable<KPICardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

export function KPICard({ label, value, delta, hint, tone = "default", index = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border bg-gradient-card p-5 shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {delta && (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", "bg-primary/10 text-primary")}>
            {delta}
          </span>
        )}
      </div>
      <div className={cn("mt-3 text-3xl font-semibold tracking-tight", toneCls[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
    </motion.div>
  );
}
