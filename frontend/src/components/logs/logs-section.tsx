"use client";

import { useEffect, useRef, useState } from "react";
import { GripHorizontal } from "lucide-react";

import { getLogs } from "@/lib/api";
import type {
  LogRecord,
  LogsResponse,
} from "@/lib/types";

import LogsTable from "./logs-table";
import Pagination from "./pagination";

type LogsSectionProps = {
  uploadId: string;
  startDate?: string;
  endDate?: string;
  serviceId?: string;
};

const PAGE_SIZE = 20;
const DEFAULT_HEIGHT = 420;
const MIN_HEIGHT = 260;

export default function LogsSection({
  uploadId,
  startDate,
  endDate,
  serviceId,
}: LogsSectionProps) {
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [pagination, setPagination] =
    useState<LogsResponse["pagination"] | null>(null);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const resizeStartRef = useRef<{
    startY: number;
    startHeight: number;
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [uploadId, startDate, endDate, serviceId]);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const data = await getLogs({
          upload_id: uploadId,
          start_date: startDate,
          end_date: endDate,
          service_id: serviceId || undefined,
          page,
          page_size: PAGE_SIZE,
        });

        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load monitoring records",
        );
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [
    uploadId,
    startDate,
    endDate,
    serviceId,
    page,
  ]);

  function handleResizeStart(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();

    resizeStartRef.current = {
      startY: event.clientY,
      startHeight: height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }

  function handleResizeMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!resizeStartRef.current) {
      return;
    }

    const { startY, startHeight } = resizeStartRef.current;
    const delta = startY - event.clientY;

    const maxHeight = Math.max(
      MIN_HEIGHT,
      Math.floor(window.innerHeight * 0.7),
    );

    setHeight(
      Math.min(
        maxHeight,
        Math.max(MIN_HEIGHT, startHeight + delta),
      ),
    );
  }

  function handleResizeEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (!resizeStartRef.current) {
      return;
    }

    resizeStartRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  return (
    <section
      style={{ height, maxHeight: "70vh" }}
      className="mt-3 flex min-h-[260px] shrink-0 flex-col rounded-xl border border-border bg-card shadow-lg"
    >
      <button
        type="button"
        aria-label="Resize monitoring logs"
        title="Drag to resize"
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
        className="group flex h-3 w-full shrink-0 cursor-ns-resize touch-none items-center justify-center rounded-t-xl hover:bg-muted/60"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/50 transition group-hover:text-primary" />
      </button>

      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/20 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold">
            Monitoring logs
          </h2>

          {pagination && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {pagination.total.toLocaleString()} records
            </p>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading monitoring records...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="m-5 overflow-auto rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="min-h-0 flex-1 overflow-auto">
            <LogsTable logs={logs} />
          </div>

          {pagination && (
            <div className="shrink-0 border-t border-border px-5 py-3">
              <Pagination
                page={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
