from datetime import datetime
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import HealthCheck, Upload
from app.services.csv_processor import NormalizedHealthCheck, ProcessingResult


def create_upload(
    session: Session,
    filename: str,
    file_hash: str,
    uploaded_at: datetime,
    result: ProcessingResult,
) -> Upload:
    upload = Upload(
        filename=filename,
        file_hash=file_hash,
        uploaded_at=uploaded_at,
        status="completed",
        total_rows=(
            result.processed_rows + result.rejected_count + result.duplicate_count
        ),
        processed_rows=result.processed_rows,
        invalid_rows=result.rejected_count,
        duplicate_rows=result.duplicate_count,
    )

    session.add(upload)
    session.flush()

    return upload


def insert_health_checks(
    session: Session,
    upload_id: UUID,
    records: list[NormalizedHealthCheck],
) -> int:
    if not records:
        return 0

    values = [
        {
            "upload_id": upload_id,
            "service_id": record.service_id,
            "service_name": record.service_name,
            "timestamp": record.timestamp,
            "status_code": record.status_code,
            "is_valid": record.is_valid,
            "is_success": record.is_success,
            "latency_ms": record.latency_ms,
            "agent": record.agent,
            "region": record.region,
        }
        for record in records
    ]

    statement = (
        insert(HealthCheck)
        .values(values)
        .on_conflict_do_nothing(constraint="uq_health_check_observation")
        .returning(HealthCheck.id)
    )

    result = session.execute(statement)

    inserted_ids = result.scalars().all()

    return len(inserted_ids)


def get_upload_by_hash(
    session: Session,
    file_hash: str,
) -> Upload | None:
    statement = select(Upload).where(Upload.file_hash == file_hash)

    return session.execute(statement).scalar_one_or_none()
