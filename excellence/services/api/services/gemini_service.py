import google.generativeai as genai

from config import settings

genai.configure(api_key=settings.gemini_api_key)

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


class GeminiService:
    def __init__(self) -> None:
        self.model = genai.GenerativeModel(settings.gemini_model)

    async def generate(self, prompt: str, system_instruction: str = "") -> str:
        full = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
        response = await self.model.generate_content_async(full)
        return response.text

    async def extract_table_structure(self, raw_content: str, hint: str = "") -> str:
        prompt = f"User hint: {hint}\n\nContent:\n{raw_content}"
        return await self.generate(prompt, TABLE_EXTRACTION_SYSTEM)


gemini_service = GeminiService()
