"use client";

import type { ReactNode } from "react";
import { Activity, Database, FileCheck2, Rows3 } from "lucide-react";

import type { Upload } from "@/lib/types";

import CsvUpload from "../dataset/csv-upload";
import DatasetSelector from "../dataset/dataset-selector";
import EmptyDatasetState from "../dataset/empty-dataset-state";
import MonitoringFilters from "../filters/monitoring-filters";
import LogsSection from "../logs/logs-section";
import StatsSection from "../stats/stats-section";

type DashboardOverviewProps = {
  uploads: Upload[];
  loading: boolean;
  error: string;
  selectedUploadId: string;
  startDate: string;
  endDate: string;
  serviceId: string;
  services: {
    service_id: string;
    service_name: string;
  }[];
  onSelectUpload: (uploadId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onClearFilters: () => void;
  onUploadComplete: () => Promise<void>;
};

export default function DashboardOverview({
  uploads,
  loading,
  error,
  selectedUploadId,
  startDate,
  endDate,
  serviceId,
  services,
  onSelectUpload,
  onStartDateChange,
  onEndDateChange,
  onServiceChange,
  onClearFilters,
  onUploadComplete,
}: DashboardOverviewProps) {
  const selectedUpload = uploads.find(
    (upload) => upload.id === selectedUploadId,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        eyebrow="Overview"
        title="SLA Monitoring"
        description="A focused view of availability, service health, and operational performance."
        action={
          uploads.length > 0 ? (
            <CsvUpload onUploadComplete={onUploadComplete} />
          ) : undefined
        }
      />

      {!loading && uploads.length === 0 ? (
        <EmptyDatasetState>
          <CsvUpload onUploadComplete={onUploadComplete} />
        </EmptyDatasetState>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
          <div className="mx-auto max-w-[1600px]">
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <section className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    Observation scope
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {selectedUpload?.filename ?? "Select a dataset"}
                  </p>

                  {selectedUpload && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                        <Rows3 className="h-3 w-3" />
                        {selectedUpload.total_rows.toLocaleString()} rows
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                        <FileCheck2 className="h-3 w-3" />
                        {selectedUpload.stored_rows.toLocaleString()} stored
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                        <Database className="h-3 w-3" />
                        {selectedUpload.duplicate_rows.toLocaleString()} duplicates
                      </span>
                    </div>
                  )}
                </div>

                <DatasetSelector
                  uploads={uploads}
                  selectedUploadId={selectedUploadId}
                  loading={loading}
                  onSelectUpload={onSelectUpload}
                />
              </div>
            </section>

            <StatsSection
              uploadId={selectedUploadId || undefined}
              startDate={startDate || undefined}
              endDate={endDate || undefined}
            />

            <section className="mt-6">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Logs
                </p>
                <h2 className="mt-1 text-lg font-semibold">Monitoring records</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inspect the underlying health-check records for the selected dataset.
                </p>
              </div>

              <MonitoringFilters
                startDate={startDate}
                endDate={endDate}
                serviceId={serviceId}
                services={services}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                onServiceChange={onServiceChange}
                onClear={onClearFilters}
              />

              {selectedUploadId && (
                <LogsSection
                  uploadId={selectedUploadId}
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  serviceId={serviceId || undefined}
                />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b border-border bg-background px-6 py-5">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        {action}
      </div>
    </header>
  );
}
