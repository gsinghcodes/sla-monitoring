"use client";

import { useEffect, useState } from "react";

import { getUploads } from "@/lib/api";
import type { Upload } from "@/lib/types";

import DashboardOverview from "./dashboard-view";


const services = [
  { service_id: "svc-auth", service_name: "auth-api" },
  { service_id: "svc-notify", service_name: "notify-worker" },
  { service_id: "svc-payments", service_name: "payments-api" },
  { service_id: "svc-reports", service_name: "reports-api" },
  { service_id: "svc-search", service_name: "search-api" },
];


export default function Dashboard() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUploads() {
    try {
      setLoading(true);
      setError("");

      const data = await getUploads();

      setUploads(data.uploads);

      setSelectedUploadId((currentId) => {
        if (!data.uploads.length) {
          return "";
        }

        const stillExists = data.uploads.some(
          (upload) => upload.id === currentId,
        );

        return stillExists ? currentId : data.uploads[0].id;
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load uploads",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUploads();
  }, []);

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setServiceId("");
  }

    return (
      <DashboardOverview
        uploads={uploads}
        loading={loading}
        error={error}
        selectedUploadId={selectedUploadId}
        startDate={startDate}
        endDate={endDate}
        serviceId={serviceId}
        services={services}
        onSelectUpload={setSelectedUploadId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onServiceChange={setServiceId}
        onClearFilters={clearFilters}
        onUploadComplete={loadUploads}
      />
    );
}
