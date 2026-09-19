import type { ReactNode } from "react";
import { Database } from "lucide-react";

type EmptyDatasetStateProps = {
  children: ReactNode;
};

export default function EmptyDatasetState({
  children,
}: EmptyDatasetStateProps) {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center px-6 pb-6">
      <div className="flex w-full max-w-xl flex-col items-center rounded-xl border border-dashed border-border bg-muted/10 px-8 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Database className="h-5 w-5 text-muted-foreground" />
        </div>

        <h2 className="mt-4 text-base font-semibold">
          No monitoring datasets
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Upload a CSV health-check dataset to start monitoring
          service availability, errors, and performance.
        </p>

        <div className="mt-6">{children}</div>

        <p className="mt-3 text-xs text-muted-foreground">
          CSV files only
        </p>
      </div>
    </section>
  );
}
