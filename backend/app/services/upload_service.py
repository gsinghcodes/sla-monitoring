from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.database.repository import (
    create_upload,
    get_upload_by_hash,
    insert_health_checks,
)
from app.services.csv_processor import process_csv
from app.services.file_utils import calculate_file_hash


def process_upload(
    session: Session,
    file_path: str,
    filename: str,
):
    print(f"[1] start {datetime.now()}")
    file_hash = calculate_file_hash(file_path)
    print(f"[2] hash done {datetime.now()}")

    existing_upload = get_upload_by_hash(
        session=session,
        file_hash=file_hash,
    )
    print(f"[3] first query done (connection cost included) {datetime.now()}")

    if existing_upload is not None:
        return {
            "is_duplicate_file": True,
            "upload": existing_upload,
        }

    result = process_csv(file_path)
    print(f"[4] csv parsed, {len(result.records)} records {datetime.now()}")

    try:
        upload = create_upload(
            session=session,
            filename=filename,
            file_hash=file_hash,
            uploaded_at=datetime.now(timezone.utc),
            result=result,
        )
        print(f"[5] upload row created {datetime.now()}")

        inserted_count = insert_health_checks(
            session=session,
            upload_id=upload.id,
            records=result.records,
        )
        print(f"[6] bulk insert executed {datetime.now()}")

        session.commit()
        print(f"[7] commit done {datetime.now()}")

        return {
            "is_duplicate_file": False,
            "upload_id": str(upload.id),
            "result": result,
            "inserted_count": inserted_count,
        }

    except Exception:
        session.rollback()
        raise
