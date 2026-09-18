from datetime import datetime, timedelta, date
from uuid import UUID

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select, func
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


def get_health_checks(
    session: Session,
    upload_id: UUID | None = None,
    service_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[HealthCheck], int]:
    conditions = []

    if upload_id is not None:
        conditions.append(HealthCheck.upload_id == upload_id)

    if service_id is not None:
        conditions.append(HealthCheck.service_id == service_id)

    if start_date is not None:
        conditions.append(
            HealthCheck.timestamp
            >= datetime.combine(
                start_date,
                datetime.min.time(),
            )
        )

    if end_date is not None:
        conditions.append(
            HealthCheck.timestamp
            < datetime.combine(
                end_date + timedelta(days=1),
                datetime.min.time(),
            )
        )

    count_statement = select(func.count(HealthCheck.id)).where(*conditions)

    total = session.execute(count_statement).scalar_one()

    statement = (
        select(HealthCheck)
        .where(*conditions)
        .order_by(HealthCheck.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    records = session.execute(statement).scalars().all()

    return records, total


def get_upload_by_hash(
    session: Session,
    file_hash: str,
) -> Upload | None:
    statement = select(Upload).where(Upload.file_hash == file_hash)

    return session.execute(statement).scalar_one_or_none()


def get_uploads(
    session: Session,
) -> list[Upload]:
    statement = select(Upload).order_by(Upload.uploaded_at.desc())

    return session.execute(statement).scalars().all()
