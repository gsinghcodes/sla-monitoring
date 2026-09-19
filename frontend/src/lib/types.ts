export type Upload = {
  id: string;
  filename: string;
  uploaded_at: string;
  status: string;
  total_rows: number;
  stored_rows: number;
  duplicate_rows: number;
};

export type UploadResponse = {
  success: boolean;
  duplicate: boolean;
  upload_id: string;
  filename?: string;
  total_rows?: number;
  stored_rows: number;
  duplicate_rows?: number;
  inserted_rows?: number;
  message?: string;
};

export type UploadsResponse = {
  uploads: Upload[];
};

export type LatencyStats = {
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  max_ms: number | null;
};

export type ServiceStats = {
  service_id: string;
  service_name: string;
  availability_percent: number;
  error_rate_percent: number;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  latency: LatencyStats;
  sla_met: boolean;
};

export type StatsResponse = {
  availability_percent: number;
  error_rate_percent: number;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  sla_threshold_percent: number;
  sla_met: boolean;
  latency: LatencyStats;
  services: ServiceStats[];
};

export type DataQuality = {
  field: string;
  original_value: string;
  action: "normalized" | "invalid";
  normalized_value: string | null;
  reason: string;
};

export type LogRecord = {
  id: string;
  upload_id: string;
  timestamp: string;
  service_id: string;
  service_name: string;
  status_code: number;
  latency_ms: number | null;
  agent: string;
  region: string;
  data_quality: DataQuality[] | null;
};

export type LogsResponse = {
  logs: LogRecord[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
};

export type LogsRequest = {
  upload_id?: string;
  service_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
};