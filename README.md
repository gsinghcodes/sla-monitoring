# SLA Monitoring Dashboard

A full-stack, serverless SLA monitoring platform that ingests health-check telemetry via CSV, validates and normalizes the data, persists monitoring observations in PostgreSQL, and provides an interactive dashboard for SLA availability, reliability, latency, and log analysis.

---

## Architecture

```text
Next.js / Vercel
      │
      │ HTTPS
      ▼
AWS API Gateway
      │
      ├── POST /api/upload  ──► Upload Lambda
      ├── GET  /api/stats   ──► Stats Lambda
      ├── POST /api/logs    ──► Logs Lambda
      ├── GET  /api/uploads ──► Uploads Lambda
      └── GET  /api/health  ──► Health Lambda
                                  │
                                  ▼
                           Supabase PostgreSQL
                            ┌────────┴────────┐
                            ▼                 ▼
                         uploads        health_checks
```

The backend uses FastAPI + Mangum deployed as separate AWS Lambda functions. Lambda functions are stateless, while PostgreSQL is the persistent source of truth.

The frontend is built with Next.js and deployed on Vercel.

PostgreSQL is hosted using Supabase.

---

## Data Flow

```text
CSV
 │
 ▼
API Gateway
 │
 ▼
Upload Lambda
 │
 ├── Parse
 ├── Validate
 ├── Normalize
 ├── Deduplicate
 └── Persist
 │
 ▼
PostgreSQL
 │
 ├───────────────┐
 ▼               ▼
Stats Lambda   Logs Lambda
 │               │
 ▼               ▼
Metrics        Normalized
               observations
 │               │
 └───────┬───────┘
         ▼
   Next.js Dashboard
```

---

## Ingestion Pipeline

**`POST /api/upload`**

The upload pipeline:

1. Accepts a CSV file.
2. Validates required columns.
3. Normalizes timestamps to UTC.
4. Normalizes latency to milliseconds.
5. Classifies HTTP status codes.
6. Records data-quality transformations.
7. Detects duplicate observations.
8. Persists normalized observations.
9. Records upload-level ingestion statistics.

Each upload receives a unique `upload_id`, allowing stored observations to be traced back to their source upload.

---

## Data Model

### `uploads`

Stores ingestion metadata:

- `id`
- `file_hash`
- `filename`
- `uploaded_at`
- `status`
- `total_rows`
- `stored_rows`
- `duplicate_rows`

`file_hash` prevents the same CSV file from being uploaded repeatedly.

### `health_checks`

Stores normalized monitoring observations:

- `id`
- `upload_id`
- `service_id`
- `service_name`
- `timestamp`
- `status_code`
- `is_valid`
- `is_success`
- `latency_ms`
- `agent`
- `region`
- `data_quality`

Observations are uniquely identified by:

```
service_id + timestamp + agent + region
```

This prevents duplicate monitoring observations from being stored.

---

## Data Quality Findings

The supplied datasets contained several inconsistencies that required normalization:

| Issue | Handling |
|---|---|
| Mixed timestamp formats | Converted to UTC |
| Unix timestamps | Converted to UTC |
| Timezone offsets | Converted to UTC |
| Latency in seconds | Converted to milliseconds |
| Missing latency | Stored as `NULL` |
| Negative latency | Observation marked invalid |
| HTTP status 999 | Observation marked invalid |
| HTTP 5xx | Valid observation, failed check |
| Exact duplicate rows | Removed |
| Same observation represented with different timestamp offsets | Deduplicated after UTC normalization |

Invalid observations are retained with `is_valid = false` so the original monitoring record is not silently lost. They are excluded from SLA/statistical calculations.

`data_quality` records the relevant normalization or invalidation details for an observation.

### Status Classification

- `2xx` → valid + successful
- `5xx` → valid + failed
- other/invalid status → invalid

A 5xx response represents a legitimate service failure and therefore participates in availability and error-rate calculations.

Invalid observations do not count as outages.

---

## SLA Calculation

Availability is calculated as:

```
successful valid checks
────────────────────────── × 100
total valid checks
```

The dashboard uses **99.9% availability** as the SLA threshold, based on the example given in the assignment.

The dataset spans different observation periods, so the dashboard refers to the result as **observed availability** rather than assuming every dataset represents a calendar month.

---

## Metrics

The dashboard exposes:

- Availability
- SLA status
- Error rate
- Successful checks
- Failed checks
- Total valid checks
- P50 latency
- P95 latency
- P99 latency
- Maximum latency
- Per-service statistics
- Observation period

Availability is the primary SLA metric.

Latency is treated as an operational performance metric rather than an SLA compliance condition because the assignment does not specify a contractual latency threshold.

---

## Log Explorer

**`POST /api/logs`**

The log explorer provides paginated access to the underlying observations.

Supported filters:

- Upload/dataset
- Single date
- Date range
- Service
- Pagination

Each log can expose its associated `data_quality` information, allowing an engineer to inspect how individual records were normalized.

---

## Key Architectural Decisions

### Stateless Compute

Lambda functions do not depend on local persistent state. All application data is stored in PostgreSQL.

### FastAPI + Mangum

```text
API Gateway
     ↓
Lambda
     ↓
Mangum
     ↓
FastAPI
     ↓
Application logic
```

Mangum adapts AWS Lambda events to the FastAPI ASGI application.

### Micro-Lambda Architecture

```text
/api/upload  → Upload Lambda
/api/stats   → Stats Lambda
/api/logs    → Logs Lambda
/api/uploads → Uploads Lambda
/api/health  → Health Lambda
```

This keeps ingestion, querying, and supporting endpoints independently executable while allowing shared application services.

### Data Lineage

Every stored health check references its originating upload:

```text
CSV
 ↓
uploads.id
 ↓
health_checks.upload_id
```

This provides traceability from dashboard observations back to the uploaded dataset.

### Lambda Dependency Packaging

Dependencies are packaged for the Linux environment used by AWS Lambda rather than using the Windows development environment directly.

The deployment artifact contains the application and runtime dependencies at the ZIP root.

---

## Hosting

- **Frontend:** Vercel
- **API:** AWS API Gateway + AWS Lambda
- **Database:** Supabase PostgreSQL

All components are deployed using free-tier/no-cost resources within the assignment constraints.

---

## Running Locally

### Frontend

```bash
npm install
npm run dev
```

Set:

```
NEXT_PUBLIC_API_URL=<API_URL>
```

### Backend

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Set:

```
DATABASE_URL=<SUPABASE_DATABASE_URL>
```

Run locally:

```bash
uvicorn app.main:app --reload
```

---

## Deployment

The backend is deployed using Serverless Framework:

```bash
serverless deploy
```

The Lambda deployment artifact is built for the AWS Lambda Linux runtime before deployment.

---

## Assumptions

- 99.9% is used as the SLA threshold because the assignment provides it as the example SLA.
- Availability is the contractual SLA metric.
- Latency is an operational metric because no latency SLA threshold is specified.
- 5xx responses are valid failed checks.
- Invalid observations are retained for traceability but excluded from SLA calculations.
- Missing latency does not invalidate an otherwise valid availability observation.
- Timestamps are normalized to UTC before comparison and deduplication.
- Dataset periods are determined from the uploaded data rather than assumed to be monthly.

---

## Live Application

- **Frontend:** `https://sla-monitoring-two.vercel.app`