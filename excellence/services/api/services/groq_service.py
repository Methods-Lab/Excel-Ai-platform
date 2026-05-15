from __future__ import annotations

import json
import re
from typing import Any

import httpx

from config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

TABLE_EXTRACTION_SYSTEM = (
    "You are a precise data extraction engine. "
    "Extract tabular data from the provided content. "
    "Respond ONLY with a valid JSON object. "
    "No markdown fences. No explanation. No preamble. "
    'JSON schema: {"name": string, "sheetName": string, '
    '"headers": [{"name": string, "inferredType": string, "format": string|null}], '
    '"rows": any[][], '
    '"flaggedCells": [{"row": int, "col": int, "rawValue": string, '
    '"suggestedValue": string, "confidence": float, "reason": string}], '
    '"sourceRef": string}'
)


def _strip_fences(text: str) -> str:
    candidate = text.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", candidate, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    return candidate


class GroqService:
    def __init__(self) -> None:
        self.api_key = settings.groq_api_key.strip()
        self.model = settings.groq_model.strip() or DEFAULT_GROQ_MODEL

    async def _chat_completion(self, messages: list[dict[str, str]]) -> str:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY not set.")

        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1024,
            "top_p": 1,
            "stream": False,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(GROQ_API_URL, headers=headers, json=payload)

        if response.is_error:
            detail = response.text.strip() or response.reason_phrase
            raise RuntimeError(f"Groq API request failed ({response.status_code}): {detail}")

        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError("Groq response did not contain any choices.")

        message = choices[0].get("message") or {}
        content = message.get("content") or ""
        if not content.strip():
            raise RuntimeError("Groq response was empty.")
        return content

    async def generate(self, prompt: str, system_instruction: str = "") -> str:
        messages: list[dict[str, str]] = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        return await self._chat_completion(messages)

    async def extract_table_structure(self, raw_content: str, hint: str = "") -> str:
        prompt = f"User hint: {hint}\n\nContent:\n{raw_content}"
        return await self.generate(prompt, TABLE_EXTRACTION_SYSTEM)

    async def generate_table_json(self, prompt: str) -> dict[str, Any]:
        table_prompt = (
            "Return only JSON for a simple spreadsheet table. "
            "Use the schema {\"name\": string, \"sheetName\": string, "
            "\"headers\": [{\"name\": string, \"inferredType\": string, \"format\": string|null}], "
            "\"rows\": any[][], \"flaggedCells\": [], \"sourceRef\": string}. "
            "Keep the response concise and valid JSON.\n\n"
            f"Request: {prompt}"
        )
        raw = await self.generate(table_prompt)
        parsed = json.loads(_strip_fences(raw))
        if not isinstance(parsed, dict):
            raise RuntimeError("Groq table response was not a JSON object.")
        return parsed


groq_service = GroqService()