"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  ChevronDown,
  ChevronUp,
  TriangleAlert,
  XCircle,
} from "lucide-react";

import { getStats } from "@/lib/api";
import type { StatsResponse } from "@/lib/types";

import ServiceStats from "./service-stats";
import StatsCard from "./stats-card";

type StatsSectionProps = {
  uploadId?: string;
  startDate?: string;
  endDate?: string;
};

export default function StatsSection({
  uploadId,
  startDate,
  endDate,
}: StatsSectionProps) {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const data = await getStats(uploadId, startDate, endDate);
        setStats(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load statistics",
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [uploadId, startDate, endDate]);

  if (loading) {
    return (
      <section className="py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl border border-border bg-muted/30"
            />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-xl border border-border bg-muted/30" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <TriangleAlert className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Reliability
          </p>
          <h2 className="mt-1 text-lg font-semibold">Service health</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Availability is used for SLA evaluation. Latency is shown as an operational metric.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${stats.sla_met
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
          >
            {stats.sla_met ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {stats.sla_met ? "SLA met" : "SLA not met"}
            <span className="font-normal opacity-70">
              target {stats.sla_threshold_percent}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input px-2.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label="Availability"
              value={`${stats.availability_percent.toFixed(3)}%`}
              description={`SLA target ${stats.sla_threshold_percent}%`}
              icon={Activity}
              tone={stats.sla_met ? "success" : "danger"}
            />

            <StatsCard
              label="Error rate"
              value={`${stats.error_rate_percent.toFixed(3)}%`}
              description={`${stats.failed_checks.toLocaleString()} failed checks`}
              icon={AlertTriangle}
              tone={stats.error_rate_percent > 0 ? "warning" : "success"}
            />

            <StatsCard
              label="Total checks"
              value={stats.total_checks.toLocaleString()}
              description={`${stats.successful_checks.toLocaleString()} successful`}
              icon={Database}
            />

            <StatsCard
              label="P95 latency"
              value={
                stats.latency.p95_ms === null
                  ? "N/A"
                  : `${stats.latency.p95_ms.toFixed(0)} ms`
              }
              description="Operational performance metric"
              icon={Clock3}
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <ServiceStats services={stats.services} />
          </div>
        </>
      )}
    </section>
  );
}
