from fastapi import FastAPI
from mangum import Mangum
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.database.repository import get_uploads

app = FastAPI()


@app.get("/api/uploads")
def get_upload_list():
    with Session(engine) as session:
        uploads = get_uploads(session)

    return {
        "uploads": [
            {
                "id": str(upload.id),
                "filename": upload.filename,
                "uploaded_at": upload.uploaded_at,
                "status": upload.status,
                "total_rows": upload.total_rows,
                "processed_rows": upload.processed_rows,
                "rejected_rows": upload.invalid_rows,
                "duplicate_rows": upload.duplicate_rows,
            }
            for upload in uploads
        ]
    }


handler = Mangum(app)
