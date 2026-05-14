from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Excellence OCR Service", version="0.1.0")


class ExtractRequest(BaseModel):
	image_base64: str
	request_id: str


class CellResult(BaseModel):
	text: str
	confidence: float
	bbox: list[int]
	row: int
	col: int


class ExtractResponse(BaseModel):
	request_id: str
	cells: list[CellResult]
	processing_time_ms: int


@app.get("/health")
async def health():
	try:
		return {"status": "ready"}
	except Exception as exc:  # noqa: BLE001
		raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/extract", response_model=ExtractResponse)
async def extract(body: ExtractRequest) -> ExtractResponse:
	try:
		return ExtractResponse(
			request_id=body.request_id,
			cells=[],
			processing_time_ms=0,
		)
	except Exception as exc:  # noqa: BLE001
		raise HTTPException(status_code=500, detail=str(exc)) from exc
