"use client";

import { Filter, RotateCcw } from "lucide-react";

type MonitoringFiltersProps = {
  startDate: string;
  endDate: string;
  serviceId: string;
  services: {
    service_id: string;
    service_name: string;
  }[];
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  onClear: () => void;
};

export default function MonitoringFilters({
  startDate,
  endDate,
  serviceId,
  services,
  onStartDateChange,
  onEndDateChange,
  onServiceChange,
  onClear,
}: MonitoringFiltersProps) {
  const hasFilters = startDate !== "" || endDate !== "" || serviceId !== "";

  return (
    <div className="shrink-0 border-b border-border py-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-1 flex h-9 items-center gap-2 rounded-lg bg-muted px-3">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Filters</span>
        </div>

        <FilterField label="From">
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </FilterField>

        <FilterField label="To">
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </FilterField>

        <FilterField label="Service">
          <select
            value={serviceId}
            onChange={(event) => onServiceChange(event.target.value)}
            className="h-9 min-w-[190px] rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.service_id} value={service.service_id}>
                {service.service_name}
              </option>
            ))}
          </select>
        </FilterField>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
