import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Upload, FileText, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { to: "/upload",    label: "Upload",      icon: Upload },
  { to: "/summary",   label: "Insights",    icon: BarChart3 },
  { to: "/data",      label: "Data",        icon: FileText },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            CI
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Customer Intel</div>
            <div className="text-[11px] text-sidebar-foreground/60">Bank Muscat × AIONOS</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => {
            const active = loc.pathname === item.to || (item.to !== "/dashboard" && loc.pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <Link to="/" className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground">
            ← Back to landing
          </Link>
        </div>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
          <div>
            <div className="text-xs text-muted-foreground">Customer Intelligence Platform</div>
            <div className="text-sm font-semibold">{nav.find((n) => loc.pathname.startsWith(n.to))?.label ?? "Overview"}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live · v1.0
          </div>
        </header>
        <div className="px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
