from fastapi import APIRouter, HTTPException

from models.extraction_job import ExtractionJob
from services.job_service import job_service

router = APIRouter(tags=["extraction"])


@router.post("", response_model=ExtractionJob)
async def start_extraction(job: ExtractionJob) -> ExtractionJob:
    try:
        return job_service.create(job)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{job_id}", response_model=ExtractionJob)
async def get_extraction(job_id: str) -> ExtractionJob:
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
