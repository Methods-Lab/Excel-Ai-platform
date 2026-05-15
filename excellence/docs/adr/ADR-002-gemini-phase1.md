# ADR-002: Groq API for Phase 1 LLM

## Status
Accepted

## Context
Excellence needs LLM capabilities for table schema inference, column remapping, and natural language understanding. We need a cost-effective cloud LLM for Phase 1 while developing local model support.

## Decision
Use Groq API with an OpenAI-compatible chat endpoint as the primary cloud LLM via the Python FastAPI backend. TypeScript never calls the provider directly.

### Rationale
- **Fast inference**: Groq models provide low-latency responses for table inference and chat
- **OpenAI-compatible API**: Simpler integration with standard HTTP clients
- **Python backend ownership**: Keeps the provider isolated behind FastAPI
- **Alternative rejected**: Legacy cloud routing was unreliable in this workspace

## Consequences
- All Groq calls go through `services/api/services/groq_service.py`
- Electron shell calls `POST /ai/query` via `API_BASE_URL` — never the Groq API directly
- User consent required before any cloud call (consent-gate.ts)
- Local model (Phi-3.5 Mini) handles simple prompts; Groq reserved for complex reasoning
- System prompts enforce JSON-only output with no markdown fences
