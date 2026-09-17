# SLA Monitoring Dashboard Overview

A full-stack, serverless SLA monitoring platform that ingests system health-check telemetry via CSV, validates and normalizes the data, stores the resulting monitoring observations in PostgreSQL, and provides an interactive dashboard for SLA availability, reliability, performance, and underlying log analysis across configurable date and service filters.

---

## High-Level Architecture

```text
                    [ Frontend: Next.js / Vercel ]
                                  │
                                  │ HTTPS Requests
                                  ▼
                    [ API Gateway: AWS HTTP API ]
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
                [POST]         [GET]         [GET]
                /upload        /stats        /logs
                    │             │             │
                    ▼             ▼             ▼
              [ Upload ]      [ Stats ]      [ Logs ]
              [ Lambda ]      [ Lambda ]     [ Lambda ]
                    │             │             │
                    └─────────────┼─────────────┘
                                  │
                                  ▼
                       [ PostgreSQL Database ]
                       [ Supabase / Neon ]
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
                 uploads       services     health_checks
```

The application follows a Micro-Lambda pattern, with separate Lambda functions for ingestion, metric aggregation, and log retrieval. The Lambda functions remain stateless, while PostgreSQL serves as the persistent source of truth.

---

## Core System Components

### Ingestion Pipeline (`POST /api/upload`)

Accepts a CSV file from the frontend and creates a unique `batch_id` for the upload.

The ingestion pipeline:

1. Parses the CSV.
2. Validates required fields.
3. Normalizes timestamps to UTC.
4. Converts latency values to milliseconds.
5. Classifies HTTP status codes.
6. Handles missing and invalid latency values.
7. Removes duplicate monitoring observations.
8. Persists valid observations to PostgreSQL.
9. Records ingestion statistics against the upload.

Each uploaded file is associated with an `uploads` record, providing data lineage from a stored monitoring observation back to the source CSV.

### Metrics Aggregator (`GET /api/stats`)

Runs PostgreSQL aggregation queries over the selected date range and service filters.

The dashboard provides:

* Availability / uptime percentage
* Error rate
* Successful checks
* Failed checks
* Total valid checks
* Outage count
* P50 latency
* P95 latency
* P99 latency
* Maximum latency
* Observation period
* Per-service breakdown

Availability is the primary SLA measure. A target of 99.9% is used as the documented assignment assumption based on the SLA example provided in the case study.

Latency is presented as an operational performance metric rather than an SLA compliance condition because the assignment does not define a contractual latency threshold, and observed latency can depend on workload characteristics.

### Log Explorer (`GET /api/logs`)

Provides paginated access to the underlying monitoring observations.

Supported filtering includes:

* Single date
* Date range
* Service
* HTTP status
* Pagination

The log view allows engineers to inspect the individual health checks behind the aggregated SLA and performance metrics.

### Database Layer

PostgreSQL contains three core entities:

```text
uploads
services
health_checks
```

`health_checks` stores normalized monitoring observations and maintains a relationship with both the upload that produced the record and the monitored service.

Indexes are created around the application's primary query patterns, particularly service and timestamp filtering, rather than adding indexes solely for individual columns.

---

## Data Classification

The ingestion pipeline uses explicit status classification:

```text
2xx → successful and valid
5xx → failed and valid
999 → invalid monitoring observation
```

Invalid observations are excluded from SLA calculations rather than automatically being treated as service outages.

Latency is normalized to milliseconds:

```text
milliseconds → unchanged
seconds      → converted to milliseconds
missing      → NULL
negative     → NULL / invalid latency value
```

A missing or invalid latency value does not invalidate an otherwise valid availability observation.

Duplicate observations are removed using the normalized observation identity, considering:

```text
service + timestamp + agent + region
```

This prevents duplicate monitoring records from artificially affecting availability or latency calculations while preserving observations from different monitoring agents.

---

## Key Architectural Decisions

### 1. Micro-Lambda Pattern

The API is divided into three independently deployed Lambda functions:

```text
/upload → ingestion Lambda
/stats  → metrics Lambda
/logs   → logs Lambda
```

This separates the heavier CSV ingestion workload from the read-oriented dashboard operations while keeping each function small and independently deployable.

A single FastAPI-based Lambda application was also considered. The Micro-Lambda approach was selected because the three operations have sufficiently different responsibilities and can remain independently simple.

### 2. Stateless Compute

The Lambda functions do not maintain application state between invocations.

Persistent state is stored in PostgreSQL, allowing any Lambda invocation to query the same source of truth.

### 3. Explicit Data Classification

Rather than repeatedly interpreting HTTP status codes inside SQL queries, the ingestion layer derives explicit validity and success information when the observation is written.

For example:

```text
status_code = 200
is_valid = true
is_success = true

status_code = 503
is_valid = true
is_success = false

status_code = 999
is_valid = false
is_success = false
```

This keeps the business logic consistent across metric calculations and log inspection.

### 4. Data Lineage

Every upload receives a unique `batch_id`.

This allows the system to trace a monitoring observation back to the CSV upload that produced it and provides visibility into ingestion results such as:

```text
total rows
valid rows
invalid rows
duplicate rows
processed rows
```

### 5. Availability as the SLA Measure

The dashboard distinguishes between contractual SLA evaluation and operational monitoring.

```text
SLA
└── Availability / Uptime

Reliability
└── Error rate

Performance
├── P50 latency
├── P95 latency
├── P99 latency
└── Maximum latency
```

Availability and error rate are complementary under the selected status classification, while latency is retained as a performance diagnostic rather than being treated as a contractual SLA breach.

---

## Data Flow

```text
CSV Upload
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
Stats Lambda    Logs Lambda
    │               │
    ▼               ▼
Aggregated       Raw normalized
metrics          observations
    │               │
    └───────┬───────┘
            ▼
       Next.js Dashboard
```
