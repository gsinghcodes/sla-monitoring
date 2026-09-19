import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const toneStyles = {
  neutral: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    value: "text-foreground",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    value: "text-foreground",
  },
  danger: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    value: "text-foreground",
  },
};

export default function StatsCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: StatsCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>

          <p className={cn("mt-2 text-2xl font-semibold tracking-tight", styles.value)}>
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className={cn("rounded-lg p-2.5", styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
