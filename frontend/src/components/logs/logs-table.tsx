"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
} from "lucide-react";

import type { LogRecord } from "@/lib/types";

type LogsTableProps = {
  logs: LogRecord[];
};

export default function LogsTable({ logs }: LogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center px-6">
        <div className="text-center">
          <CircleDot className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No records found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try widening the date range or clearing the service filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <table className="w-full min-w-[900px] text-left text-sm">
      <thead className="sticky top-0 z-10 border-b border-border bg-muted/95 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
        <tr>
          <th className="w-10 px-4 py-3" />
          <th className="whitespace-nowrap px-4 py-3 font-semibold">Timestamp</th>
          <th className="px-4 py-3 font-semibold">Service</th>
          <th className="px-4 py-3 font-semibold">Status</th>
          <th className="px-4 py-3 font-semibold">Latency</th>
          <th className="px-4 py-3 font-semibold">Agent</th>
          <th className="px-4 py-3 font-semibold">Region</th>
          <th className="px-4 py-3 font-semibold">Quality</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {logs.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
      </tbody>
    </table>
  );
}

/*
 * A small keyed state store avoids adding a state hook inside the map callback.
 * The component is intentionally local to the table so each row stays independent.
 */
function useStateRow(key: string) {
  const [expanded, setExpanded] = useState(false);
  return [expanded, setExpanded] as const;
}

function LogRow({ log }: { log: LogRecord }) {
  const [expanded, setExpanded] = useState(false);
  const success = log.status_code >= 200 && log.status_code < 300;
  const hasQualityEvents = Boolean(log.data_quality?.length);
  const hasInvalidEvent = Boolean(
    log.data_quality?.some((item) => item.action === "invalid"),
  );

  return (
    <>
      <tr
        className={`transition hover:bg-muted/40 ${
          expanded ? "bg-muted/20" : ""
        }`}
      >
        <td className="px-4 py-3">
          {hasQualityEvents ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={expanded ? "Collapse row details" : "Expand row details"}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </td>

        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
          {formatTimestamp(log.timestamp)}
        </td>

        <td className="px-4 py-3">
          <div className="font-medium">{log.service_name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {log.service_id}
          </div>
        </td>

        <td className="px-4 py-3">
          <span
            className={`inline-flex min-w-14 items-center justify-center rounded-md px-2 py-1 font-mono text-xs font-semibold ${
              success
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : hasInvalidEvent
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "bg-red-500/10 text-red-700 dark:text-red-400"
            }`}
          >
            {log.status_code}
          </span>
        </td>

        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
            <Clock3 className="h-3 w-3 text-muted-foreground" />
            {log.latency_ms === null ? "N/A" : `${log.latency_ms.toFixed(2)} ms`}
          </span>
        </td>

        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {log.agent}
        </td>

        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {log.region}
        </td>

        <td className="px-4 py-3">
          {!hasQualityEvents ? (
            <span className="text-xs text-muted-foreground">Clean</span>
          ) : hasInvalidEvent ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Invalid
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="h-3 w-3" />
              Normalized
            </span>
          )}
        </td>
      </tr>

      {expanded && hasQualityEvents && (
        <tr className="bg-muted/10">
          <td colSpan={8} className="px-14 py-4">
            <div className="grid gap-3 md:grid-cols-2">
              {log.data_quality?.map((item, index) => (
                <div
                  key={`${item.field}-${index}`}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold capitalize">
                      {item.field.replaceAll("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.action === "invalid"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {item.action}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Original</p>
                      <p className="mt-0.5 break-all font-mono">
                        {item.original_value}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Normalized</p>
                      <p className="mt-0.5 break-all font-mono">
                        {item.normalized_value ?? "Not stored"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function formatTimestamp(timestamp: string) {
  return `${new Date(timestamp).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })} UTC`;
}