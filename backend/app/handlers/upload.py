import os
import tempfile

from fastapi import FastAPI, File, UploadFile
from mangum import Mangum
from sqlalchemy.orm import Session

from app.database.connection import engine
from app.services.upload_service import process_upload

app = FastAPI()


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename:
        return {
            "success": False,
            "error": "Filename is required",
        }

    if not file.filename.lower().endswith(".csv"):
        return {
            "success": False,
            "error": "Only CSV files are supported",
        }

    contents = await file.read()

    with tempfile.NamedTemporaryFile(
        mode="wb",
        suffix=".csv",
        delete=False,
    ) as temporary_file:
        temporary_file.write(contents)
        temporary_file_path = temporary_file.name

    try:
        with Session(engine) as session:

            result = process_upload(
                session=session,
                file_path=temporary_file_path,
                filename=file.filename,
            )

        if result["is_duplicate_file"]:
            return {
                "success": True,
                "duplicate": True,
                "upload_id": str(result["upload_id"]),
                "message": "This file has already been uploaded",
            }

        processing_result = result["result"]

        return {
            "success": True,
            "duplicate": False,
            "upload_id": str(result["upload_id"]),
            "filename": file.filename,
            "total_rows": (
                processing_result.processed_rows
                + processing_result.rejected_count
                + processing_result.duplicate_count
            ),
            "processed_rows": processing_result.processed_rows,
            "rejected_rows": processing_result.rejected_count,
            "duplicate_rows": processing_result.duplicate_count,
            "inserted_rows": result["inserted_count"],
        }

    finally:
        os.remove(temporary_file_path)


handler = Mangum(app)
