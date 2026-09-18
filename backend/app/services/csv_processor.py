from datetime import datetime, timezone
from dataclasses import dataclass, field
import csv


class RowValidationError(ValueError):
    def __init__(
        self,
        field: str,
        original_value: str,
        reason: str,
    ):
        self.field = field
        self.original_value = original_value
        self.reason = reason

        super().__init__(reason)


@dataclass
class NormalizedHealthCheck:
    service_id: str
    service_name: str
    timestamp: datetime
    status_code: int
    is_valid: bool
    is_success: bool
    latency_ms: float | None
    agent: str
    region: str


@dataclass
class DataWarning:
    row_number: int
    field: str
    original_value: str
    message: str
    normalized_value: str


@dataclass
class RejectedRow:
    row_number: int
    field: str
    original_value: str
    reason: str


@dataclass
class ProcessingResult:
    records: list[NormalizedHealthCheck] = field(default_factory=list)
    warnings: list[DataWarning] = field(default_factory=list)
    rejected_rows: list[RejectedRow] = field(default_factory=list)
    duplicate_rows: list[int] = field(default_factory=list)

    @property
    def processed_rows(self) -> int:
        return len(self.records)

    @property
    def warning_count(self) -> int:
        return len(self.warnings)

    @property
    def rejected_count(self) -> int:
        return len(self.rejected_rows)

    @property
    def duplicate_count(self) -> int:
        return len(self.duplicate_rows)


def normalize_health_check(
    row: dict, row_number: int
) -> tuple[NormalizedHealthCheck, list[DataWarning]]:
    warnings = []

    is_valid, is_success = classify_status(row["status_code"])

    if not is_valid:
        raise RowValidationError(
            field="status_code",
            original_value=str(row["status_code"]),
            reason=f"Invalid status code: {row['status_code']}",
        )

    timestamp, timestamp_normalized, timestamp_warning = normalize_timestamp(
        row["timestamp"]
    )

    if timestamp_normalized:
        warnings.append(
            DataWarning(
                row_number=row_number,
                field="timestamp",
                original_value=str(row["timestamp"]),
                message=timestamp_warning,
                normalized_value=timestamp.isoformat(),
            )
        )

    try:
        latency_ms, latency_normalized, latency_warning = normalize_latency(
            row.get("latency"),
            row.get("latency_unit"),
        )
    except ValueError as error:
        raise RowValidationError(
            field="latency",
            original_value=str(row.get("latency")),
            reason=str(error),
        ) from error

    if latency_normalized:
        warnings.append(
            DataWarning(
                row_number=row_number,
                field="latency",
                original_value=f"{row.get('latency')} {row.get('latency_unit')}",
                message=latency_warning,
                normalized_value=f"{latency_ms} ms",
            )
        )

    record = NormalizedHealthCheck(
        service_id=str(row["service_id"]).strip(),
        service_name=str(row["service_name"]).strip(),
        timestamp=timestamp,
        status_code=int(row["status_code"]),
        is_valid=is_valid,
        is_success=is_success,
        latency_ms=latency_ms,
        agent=str(row["agent"]).strip(),
        region=str(row["region"]).strip(),
    )

    return record, warnings


def normalize_timestamp(
    value: str | int | float,
) -> tuple[datetime, bool, str | None]:
    """
    Convert supported timestamp formats into UTC.

    Returns:
        (
            normalized_timestamp,
            was_normalized,
            warning_message,
        )
    """

    if isinstance(value, (int, float)):
        timestamp = datetime.fromtimestamp(
            value,
            tz=timezone.utc,
        )

        return (
            timestamp,
            True,
            "Converted Unix timestamp to UTC",
        )

    value = str(value).strip()

    if value.isdigit():
        timestamp = datetime.fromtimestamp(
            int(value),
            tz=timezone.utc,
        )

        return (
            timestamp,
            True,
            "Converted Unix timestamp to UTC",
        )

    timestamp = datetime.fromisoformat(value.replace("Z", "+00:00"))

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

        return (
            timestamp,
            True,
            "Assumed UTC for timezone-less timestamp",
        )

    normalized_timestamp = timestamp.astimezone(timezone.utc)

    if timestamp.utcoffset() != timezone.utc.utcoffset(timestamp):
        return (
            normalized_timestamp,
            True,
            "Converted timestamp to UTC",
        )

    return (
        normalized_timestamp,
        False,
        None,
    )


def normalize_latency(
    value: str | int | float | None,
    unit: str | None,
) -> tuple[float | None, bool, str | None]:

    if value is None or str(value).strip() == "":
        return None, False, None

    latency = float(value)

    if latency < 0:
        raise ValueError("Negative latency value")

    normalized_unit = str(unit).strip().lower()

    if normalized_unit == "ms":
        return latency, False, None

    if normalized_unit == "s":
        return latency * 1000, True, "Converted seconds to milliseconds"

    raise ValueError(f"Unsupported latency unit: {unit}")


def classify_status(status_code: str | int) -> tuple[bool, bool]:
    """
    Classify an HTTP status code.

    Returns:
        (is_valid, is_success)
    """

    status = int(status_code)

    if 200 <= status <= 299:
        return True, True

    if 500 <= status <= 599:
        return True, False

    return False, False


def process_csv(file_path: str) -> ProcessingResult:
    result = ProcessingResult()

    seen_keys = set()

    with open(file_path, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        required_columns = {
            "service_id",
            "service_name",
            "timestamp",
            "status_code",
            "agent",
            "region",
        }

        missing_columns = required_columns - set(reader.fieldnames or [])

        if missing_columns:
            raise ValueError(
                f"Missing required columns: {', '.join(sorted(missing_columns))}"
            )

        for row_number, row in enumerate(reader, start=2):
            try:
                record, warnings = normalize_health_check(
                    row,
                    row_number,
                )

                duplicate_key = (
                    record.service_id,
                    record.timestamp,
                    record.agent,
                    record.region,
                )

                if duplicate_key in seen_keys:
                    result.duplicate_rows.append(row_number)
                    continue

                seen_keys.add(duplicate_key)

                result.records.append(record)
                result.warnings.extend(warnings)

            except RowValidationError as error:
                result.rejected_rows.append(
                    RejectedRow(
                        row_number=row_number,
                        field=error.field,
                        original_value=error.original_value,
                        reason=error.reason,
                    )
                )

            except (ValueError, TypeError, OverflowError) as error:
                result.rejected_rows.append(
                    RejectedRow(
                        row_number=row_number,
                        field="row",
                        original_value=str(row),
                        reason=str(error),
                    )
                )

    return result
