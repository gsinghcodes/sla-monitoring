import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Server,
  XCircle,
} from "lucide-react";

import type { ServiceStats as ServiceStatsType } from "@/lib/types";

type ServiceStatsProps = {
  services: ServiceStatsType[];
};

export default function ServiceStats({ services }: ServiceStatsProps) {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">Service breakdown</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare availability, failures, and latency across services.
          </p>
        </div>

        <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
          {services.length} services
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {services.map((service) => {
          const healthy = service.sla_met;

          return (
            <article
              key={service.service_id}
              className="w-[320px] shrink-0 rounded-xl border border-border bg-background p-4 transition hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {service.service_name}
                    </p>

                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                      {service.service_id}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    healthy
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  {healthy ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}

                  {healthy ? "SLA met" : "SLA breach"}
                </span>
              </div>

              <div className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {service.availability_percent.toFixed(3)}%
                    </p>

                    <p className="text-xs text-muted-foreground">
                      availability
                    </p>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <p>{service.total_checks.toLocaleString()} checks</p>

                    <p className="mt-1">
                      {service.failed_checks.toLocaleString()} failed
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Metric
                  icon={CircleAlert}
                  label="Error"
                  value={`${service.error_rate_percent.toFixed(2)}%`}
                />

                <Metric
                  icon={Activity}
                  label="P50"
                  value={formatLatency(service.latency.p50_ms)}
                />

                <Metric
                  icon={Clock3}
                  label="P95"
                  value={formatLatency(service.latency.p95_ms)}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>

      <p className="mt-1 font-mono text-xs font-medium">{value}</p>
    </div>
  );
}

function formatLatency(value: number | null): string {
  return value === null ? "N/A" : `${value.toFixed(0)} ms`;
}