from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import ai, extraction, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. Copy .env.example to .env and add your key."
        )
    print(
        f"[Excellence API] Ready | model={settings.gemini_model} | env={settings.app_env}"
    )
    yield
    print("[Excellence API] Shutdown.")


app = FastAPI(title="Excellence API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "file://"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Request-ID"],
)

app.include_router(health.router)
app.include_router(ai.router, prefix="/ai")
app.include_router(extraction.router, prefix="/extract")
