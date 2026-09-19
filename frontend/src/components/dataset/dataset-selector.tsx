import type { Upload } from "@/lib/types";
import { Database, Loader2, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DatasetSelectorProps = {
  uploads: Upload[];
  selectedUploadId: string;
  loading: boolean;
  onSelectUpload: (uploadId: string) => void;
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

export default function DatasetSelector({
  uploads,
  selectedUploadId,
  loading,
  onSelectUpload,
}: DatasetSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading datasets...
        </span>
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Database className="h-4 w-4 text-muted-foreground" />
        </div>

        <div>
          <p className="text-sm font-medium">
            No datasets available
          </p>
          <p className="text-xs text-muted-foreground">
            Upload a CSV dataset to start monitoring your services.
          </p>
        </div>
      </div>
    );
  }

  const selectedUpload = uploads.find(
    (upload) => upload.id === selectedUploadId,
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Select
        value={selectedUploadId}
        onValueChange={(value) => {
          if (value) {
            onSelectUpload(value);
          }
        }}
      >
        <SelectTrigger className="h-9 min-w-60 max-w-105 border-input bg-background text-sm">
          <SelectValue placeholder="Select dataset">
            {selectedUpload?.filename}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {uploads.map((upload) => (
            <SelectItem
              key={upload.id}
              value={upload.id}
            >
              {upload.filename}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}