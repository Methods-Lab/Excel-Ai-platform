from typing import List, Literal, Optional, Union

from .base import CamelModel
from .extraction_result import ExtractionResult


InputModality = Literal["text", "image", "url", "mixed"]
ExtractionPhase = Literal["phase1", "phase2", "phase3"]
JobStatus = Literal[
    "queued",
    "processing",
    "awaiting_preview",
    "committed",
    "failed",
    "cancelled",
]


class TextInput(CamelModel):
    type: Literal["text"]
    content: str


class ImageInput(CamelModel):
    type: Literal["image"]
    base64: str
    mime_type: Literal["image/png", "image/jpeg", "image/webp"]


class UrlInput(CamelModel):
    type: Literal["url"]
    url: str
    table_hint: Optional[str] = None


class MixedInput(CamelModel):
    type: Literal["mixed"]
    inputs: List[Union[TextInput, ImageInput, UrlInput]]


ExtractionInput = Union[TextInput, ImageInput, UrlInput, MixedInput]


class ExtractionError(CamelModel):
    code: str
    message: str
    recoverable: bool


class ExtractionJob(CamelModel):
    id: str
    modality: InputModality
    phase: ExtractionPhase
    status: JobStatus
    priority: int
    input: ExtractionInput
    result: Optional[ExtractionResult] = None
    error: Optional[ExtractionError] = None
    created_at: int
    updated_at: int
