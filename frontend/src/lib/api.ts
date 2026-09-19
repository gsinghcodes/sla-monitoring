import type {
    LogsRequest,
    LogsResponse,
    StatsResponse,
    UploadResponse,
    UploadsResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
}

export async function uploadCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to upload CSV");
    }

    return data;
}


export async function getUploads(): Promise<UploadsResponse> {
    const response = await fetch(`${API_URL}/api/uploads`, {
        method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch uploads");
    }

    return data;
}

export async function getStats(
    uploadId?: string,
    startDate?: string,
    endDate?: string,
): Promise<StatsResponse> {
    const params = new URLSearchParams();

    if (uploadId) {
        params.set("upload_id", uploadId);
    }

    if (startDate) {
        params.set("start_date", startDate);
    }

    if (endDate) {
        params.set("end_date", endDate);
    }

    const query = params.toString();

    const response = await fetch(
        `${API_URL}/api/stats${query ? `?${query}` : ""}`,
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.detail || "Failed to fetch statistics",
        );
    }

    return data;
}


export async function getLogs(
    request: LogsRequest,
): Promise<LogsResponse> {
    const response = await fetch(`${API_URL}/api/logs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch logs");
    }

    return data;
}