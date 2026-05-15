from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_service import groq_service

router = APIRouter(tags=["ai"])


class AIQueryRequest(BaseModel):
    prompt: str
    systemInstruction: str = ""
    requestId: str


class AIQueryResponse(BaseModel):
    requestId: str
    result: str


class TableExtractionRequest(BaseModel):
    content: str
    hint: str = ""
    requestId: str


@router.post("/query", response_model=AIQueryResponse)
async def query_ai(body: AIQueryRequest) -> AIQueryResponse:
    try:
        result = await groq_service.generate(body.prompt, body.systemInstruction)
        return AIQueryResponse(requestId=body.requestId, result=result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Groq error: {exc}") from exc


@router.post("/extract-table", response_model=AIQueryResponse)
async def extract_table(body: TableExtractionRequest) -> AIQueryResponse:
    try:
        result = await groq_service.extract_table_structure(body.content, body.hint)
        return AIQueryResponse(requestId=body.requestId, result=result)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Groq error: {exc}") from exc
