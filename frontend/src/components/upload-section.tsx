"use client";

import { ChangeEvent, useState } from "react";

import { uploadCsv } from "@/lib/api";
import type { UploadResponse } from "@/lib/types";

type UploadSectionProps = {
  onUploadComplete: (result: UploadResponse) => void;
};

export default function UploadSection({
  onUploadComplete,
}: UploadSectionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setError(null);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadCsv(file);

      onUploadComplete(result);
      setFile(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload CSV.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <h2>Upload CSV</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {file && <p>Selected: {file.name}</p>}

      {error && <p>{error}</p>}
    </section>
  );
}