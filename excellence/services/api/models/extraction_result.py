from typing import List, Literal

from .base import CamelModel
from .table_model import TableModel
from .validation_result import ValidationResult


ExtractionMethod = Literal[
    "ocr",
    "cheerio",
    "playwright",
    "relay",
    "paste",
    "text",
    "gemini",
]


class ExtractionResult(CamelModel):
    job_id: str
    table_model: TableModel
    validation_result: ValidationResult
    overall_confidence: float
    warnings: List[str]
    extraction_method: ExtractionMethod
