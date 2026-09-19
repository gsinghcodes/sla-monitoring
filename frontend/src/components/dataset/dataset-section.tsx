import type { Upload } from "@/lib/types";

import CsvUpload from "./csv-upload";
import DatasetSelector from "./dataset-selector";

type DatasetSectionProps = {
  uploads: Upload[];
  selectedUploadId: string;
  loading: boolean;
  error: string;
  onUploadComplete: () => Promise<void>;
  onSelectUpload: (uploadId: string) => void;
};

export default function DatasetSection({
  uploads,
  selectedUploadId,
  loading,
  error,
  onUploadComplete,
  onSelectUpload,
}: DatasetSectionProps) {
  return (
    <section className="border-b border-border bg-muted/10 px-6 py-3">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <DatasetSelector
            uploads={uploads}
            selectedUploadId={selectedUploadId}
            loading={loading}
            onSelectUpload={onSelectUpload}
          />

          <CsvUpload onUploadComplete={onUploadComplete} />
        </div>

        {error && (
          <div className="mt-3 rounded-md text-center bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}