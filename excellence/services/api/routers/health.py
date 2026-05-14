import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    timestamp: int


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    try:
        return HealthResponse(status="ok", timestamp=int(time.time() * 1000))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
