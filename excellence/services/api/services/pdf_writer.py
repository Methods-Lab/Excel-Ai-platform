from __future__ import annotations

from pathlib import Path
from typing import Any

PAGE_WIDTH = 595.28
PAGE_HEIGHT = 841.89
LEFT_MARGIN = 48.0
TOP_MARGIN = 48.0
TITLE_Y = PAGE_HEIGHT - 54.0
SUBTITLE_Y = PAGE_HEIGHT - 74.0
TABLE_TOP = PAGE_HEIGHT - 120.0
ROW_HEIGHT = 24.0


def _escape_pdf_text(value: str) -> str:
    text = value.encode("latin-1", "replace").decode("latin-1")
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _estimate_width(value: str) -> float:
    return max(28.0, float(len(value)) * 5.7 + 16.0)


def _normalize_cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return str(value)


def _build_content_stream(table: dict[str, Any]) -> str:
    title = _normalize_cell(table.get("name") or "Groq Table Preview")
    sheet_name = _normalize_cell(table.get("sheetName") or "Sheet1")
    source_ref = _normalize_cell(table.get("sourceRef") or "groq-demo")
    headers = table.get("headers") or []
    rows = table.get("rows") or []

    header_names = [_normalize_cell(header.get("name")) for header in headers]
    column_count = max(len(header_names), max((len(row) for row in rows), default=0))
    if column_count == 0:
        column_count = 1

    normalized_headers = header_names + [f"Column {index + 1}" for index in range(column_count - len(header_names))]

    column_widths = []
    for column_index in range(column_count):
        samples = [normalized_headers[column_index]]
        for row in rows:
            if column_index < len(row):
                samples.append(_normalize_cell(row[column_index]))
        column_widths.append(max(_estimate_width(sample) for sample in samples))

    usable_width = PAGE_WIDTH - (LEFT_MARGIN * 2)
    total_width = sum(column_widths)
    if total_width > usable_width:
        scale = usable_width / total_width
        column_widths = [width * scale for width in column_widths]

    commands = [
        "BT",
        "/F1 18 Tf",
        f"{LEFT_MARGIN:.2f} {TITLE_Y:.2f} Td",
        f"({_escape_pdf_text(title)}) Tj",
        "ET",
        "BT",
        "/F1 10 Tf",
        f"{LEFT_MARGIN:.2f} {SUBTITLE_Y:.2f} Td",
        f"(Sheet: {_escape_pdf_text(sheet_name)} | Source: {_escape_pdf_text(source_ref)}) Tj",
        "ET",
        "1 w",
    ]

    current_y = TABLE_TOP
    left_x = LEFT_MARGIN

    def add_cell(x: float, y: float, width: float, text: str, bold: bool = False) -> None:
        commands.extend(
            [
                f"{x:.2f} {y - ROW_HEIGHT:.2f} {width:.2f} {ROW_HEIGHT:.2f} re",
                "S",
                "BT",
                f"{'/F1-Bold' if bold else '/F1'} 9 Tf",
                f"{x + 4:.2f} {y - 16:.2f} Td",
                f"({_escape_pdf_text(text)}) Tj",
                "ET",
            ]
        )

    # Define the bold font resource by reusing Helvetica-Bold in the page resources.
    for column_index, header in enumerate(normalized_headers):
        width = column_widths[column_index]
        add_cell(left_x, current_y, width, header, bold=True)
        left_x += width

    for row in rows:
        current_y -= ROW_HEIGHT
        left_x = LEFT_MARGIN
        for column_index in range(column_count):
            width = column_widths[column_index]
            cell_text = _normalize_cell(row[column_index]) if column_index < len(row) else ""
            add_cell(left_x, current_y, width, cell_text, bold=False)
            left_x += width

    return "\n".join(commands)


def build_table_pdf(table: dict[str, Any], output_path: Path) -> Path:
    content = _build_content_stream(table)
    content_bytes = content.encode("latin-1", "replace")

    objects = [
        "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
        "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
        (
            "3 0 obj<< /Type /Page /Parent 2 0 R "
            f"/MediaBox [0 0 {PAGE_WIDTH:.2f} {PAGE_HEIGHT:.2f}] "
            "/Resources << /Font << /F1 4 0 R /F1-Bold 5 0 R >> >> "
            "/Contents 6 0 R >>endobj"
        ),
        "4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
        "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>endobj",
        f"6 0 obj<< /Length {len(content_bytes)} >>stream\n{content}\nendstream\nendobj",
    ]

    pdf_bytes = bytearray()
    pdf_bytes.extend(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf_bytes))
        pdf_bytes.extend(obj.encode("latin-1"))
        pdf_bytes.extend(b"\n")

    xref_offset = len(pdf_bytes)
    pdf_bytes.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf_bytes.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf_bytes.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf_bytes.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        ).encode("latin-1")
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(pdf_bytes)
    return output_path