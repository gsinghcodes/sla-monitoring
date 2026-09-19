"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { uploadCsv } from "@/lib/api";

type CsvUploadProps = {
  onUploadComplete: () => Promise<void>;
};

export default function CsvUpload({
  onUploadComplete,
}: CsvUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const result = await uploadCsv(file);

      if (result.duplicate) {
        setMessage("Dataset already uploaded.");
      } else {
        setMessage(
          `${result.stored_rows?.toLocaleString() ?? 0} rows stored.`,
        );
      }

      await onUploadComplete();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Failed to upload CSV",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      {message && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {message}
        </span>
      )}

      <label
        htmlFor="csv-upload"
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:bg-foreground/90"
      >
        <Upload className="h-3.5 w-3.5" />

        {uploading ? "Processing..." : "Upload CSV"}

        <input
          id="csv-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}