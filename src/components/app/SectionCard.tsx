import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-2xl border bg-card p-6 shadow-card", className)}>
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
