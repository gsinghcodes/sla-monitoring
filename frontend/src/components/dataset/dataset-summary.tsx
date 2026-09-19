import type { Upload } from "@/lib/types";

type DatasetSummaryProps = {
  upload: Upload;
};

export default function DatasetSummary({ upload }: DatasetSummaryProps) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <SummaryItem label="Total rows" value={upload.total_rows} />
      <SummaryItem label="Stored" value={upload.stored_rows} />
      <SummaryItem label="Duplicates" value={upload.duplicate_rows} />
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}
