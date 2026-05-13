from typing import Dict, Optional

from models.extraction_job import ExtractionJob, ExtractionError, JobStatus
from models.extraction_result import ExtractionResult


class JobService:
    def __init__(self) -> None:
        self._jobs: Dict[str, ExtractionJob] = {}

    def create(self, job: ExtractionJob) -> ExtractionJob:
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Optional[ExtractionJob]:
        return self._jobs.get(job_id)

    def update_status(
        self,
        job_id: str,
        status: JobStatus,
        result: Optional[ExtractionResult] = None,
        error: Optional[ExtractionError] = None,
    ) -> Optional[ExtractionJob]:
        job = self._jobs.get(job_id)
        if not job:
            return None
        job.status = status
        job.result = result
        job.error = error
        return job


job_service = JobService()
