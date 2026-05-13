from typing import List, Literal, Optional

from .base import CamelModel


IssueSeverity = Literal["error", "warning", "info"]
IssueType = Literal[
    "type_mismatch",
    "sum_discrepancy",
    "duplicate_detected",
    "missing_value",
    "ocr_low_confidence",
    "overwrite_risk",
    "cross_field_violation",
]


class ValidationIssue(CamelModel):
    type: IssueType
    row: Optional[int] = None
    col: Optional[int] = None
    message: str
    severity: IssueSeverity


class SumReconciliationResult(CamelModel):
    column_name: str
    source_total: float
    computed_total: float
    match: bool
    discrepancy: float


class DuplicateDetectionResult(CamelModel):
    duplicate_found: bool
    existing_sheet_name: Optional[str] = None
    similarity_score: Optional[float] = None


class ValidationResult(CamelModel):
    job_id: str
    passed: bool
    issues: List[ValidationIssue]
    sum_reconciliation: Optional[SumReconciliationResult] = None
    duplicate_detection: Optional[DuplicateDetectionResult] = None
