from datetime import date
from uuid import UUID

from fastapi import FastAPI, HTTPException
from mangum import Mangum
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.database.repository import get_health_checks

app = FastAPI()


class LogsRequest(BaseModel):
    upload_id: UUID | None = None
    service_id: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)


@app.post("/api/logs")
def get_logs(request: LogsRequest):
    if (
        request.start_date is not None
        and request.end_date is not None
        and request.end_date < request.start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="end_date must be greater than or equal to start_date",
        )

    with Session(engine) as session:
        records, total = get_health_checks(
            session=session,
            upload_id=request.upload_id,
            service_id=request.service_id,
            start_date=request.start_date,
            end_date=request.end_date,
            page=request.page,
            page_size=request.page_size,
        )

    return {
        "logs": [
            {
                "id": str(record.id),
                "upload_id": str(record.upload_id),
                "timestamp": record.timestamp,
                "service_id": record.service_id,
                "service_name": record.service_name,
                "status_code": record.status_code,
                "latency_ms": record.latency_ms,
                "agent": record.agent,
                "region": record.region,
            }
            for record in records
        ],
        "pagination": {
            "page": request.page,
            "page_size": request.page_size,
            "total": total,
            "total_pages": ((total + request.page_size - 1) // request.page_size),
        },
    }


handler = Mangum(app)
