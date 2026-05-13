from typing import List, Literal, Optional, Union

from .base import CamelModel


InferredType = Literal[
    "text",
    "number",
    "currency",
    "date",
    "percentage",
    "boolean",
]


class ColumnSchema(CamelModel):
    name: str
    inferred_type: InferredType
    format: Optional[str] = None


class FlaggedCell(CamelModel):
    row: int
    col: int
    raw_value: str
    suggested_value: str
    confidence: float
    reason: str


class TableModel(CamelModel):
    id: str
    name: str
    sheet_name: str
    headers: List[ColumnSchema]
    rows: List[List[Union[str, float, bool, None]]]
    flagged_cells: List[FlaggedCell]
    source_ref: str
    extracted_at: int
