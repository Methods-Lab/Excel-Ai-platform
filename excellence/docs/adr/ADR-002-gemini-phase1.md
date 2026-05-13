# ADR-002: Gemini API for Phase 1 LLM

## Status
Accepted

## Context
Excellence needs LLM capabilities for table schema inference, column remapping, and natural language understanding. We need a cost-effective cloud LLM for Phase 1 while developing local model support.

## Decision
Use Google Gemini API (`gemini-1.5-flash`) as the primary cloud LLM via the `google-generativeai` Python SDK, accessed through FastAPI endpoints. TypeScript never calls Gemini directly.

### Rationale
- **Free tier available**: Sufficient for development and early users
- **Fast response times**: Flash model optimized for speed
- **Python SDK maturity**: Async support, well-documented
- **Alternative rejected**: OpenAI GPT-4 — higher cost, no free tier suitable for dev

## Consequences
- All Gemini calls go through `services/api/services/gemini_service.py`
- Electron shell calls `POST /ai/query` via `API_BASE_URL` — never the Gemini API directly
- User consent required before any cloud call (consent-gate.ts)
- Local model (Phi-3.5 Mini) handles simple prompts; Gemini reserved for complex reasoning
- System prompts enforce JSON-only output with no markdown fences
