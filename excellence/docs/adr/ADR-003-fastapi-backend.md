# ADR-003: FastAPI Backend

## Status
Accepted

## Context
The Electron shell needs a backend service for Gemini API integration, extraction job management, and future server-side processing. We need async HTTP with Pydantic validation.

## Decision
Use FastAPI (Python 3.11+) with Uvicorn on port 8745 as the primary backend API.

### Rationale
- **Async native**: First-class async/await, ideal for LLM API calls
- **Pydantic v2**: Automatic validation, serialization, and camelCase alias generation to match TypeScript contracts
- **OpenAPI auto-docs**: Free Swagger UI for development and testing
- **Python ecosystem**: Direct access to google-generativeai, PaddleOCR, OpenCV
- **Alternative rejected**: Express.js — would duplicate the Python dependency anyway for OCR/AI libraries

## Consequences
- Port 8745 is constant — imported from `shared-types/config.ts`, never hardcoded
- CORS restricted to localhost origins only
- Electron shell spawns uvicorn as a child process, health-polls before showing window
- All route handlers are async with explicit HTTPException error handling
- Pydantic models use `alias_generator = to_camel` and `populate_by_name = True` for JSON wire compatibility
