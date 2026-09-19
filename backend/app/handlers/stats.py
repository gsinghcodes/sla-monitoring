from datetime import date
from uuid import UUID

from fastapi import FastAPI, HTTPException, Query
from mangum import Mangum
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.services.metrics import calculate_stats

app = FastAPI()


@app.get("/api/stats")
def get_stats(
    upload_id: UUID | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
):
    if start_date is not None and end_date is not None and end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date must be greater than or equal to start_date",
        )

    with Session(engine) as session:
        return calculate_stats(
            session=session,
            upload_id=upload_id,
            start_date=start_date,
            end_date=end_date,
        )


handler = Mangum(app)
