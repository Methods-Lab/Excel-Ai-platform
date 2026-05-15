from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.groq_service import groq_service  # noqa: E402
from services.pdf_writer import build_table_pdf  # noqa: E402


PROMPT = (
    "Create a simple spreadsheet table with 3 columns named Name, Department, and Score. "
    "Provide exactly 3 rows using short sample names and plausible values. "
    'Return only valid JSON using this schema: {"name": string, "sheetName": string, '
    '"headers": [{"name": string, "inferredType": string, "format": string|null}], '
    '"rows": any[][], "flaggedCells": [], "sourceRef": string}. '
    "Do not wrap the JSON in markdown fences."
)

async def _run_demo(tmp_path: Path) -> None:
    print("[demo] starting Groq table generation")
    print(f"[demo] model={groq_service.model}")

    raw = await groq_service.generate_table_json(PROMPT)
    print("[demo] Groq response parsed as JSON")
    print(json.dumps(raw, indent=2))

    pdf_path = build_table_pdf(raw, tmp_path / "groq-table-demo.pdf")
    print(f"[demo] PDF written to: {pdf_path}")

    assert pdf_path.exists()
    assert pdf_path.read_bytes().startswith(b"%PDF-1.4")


def test_groq_table_pdf_demo(tmp_path: Path) -> None:
    asyncio.run(_run_demo(tmp_path))