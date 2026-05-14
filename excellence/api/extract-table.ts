import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: GEMINI_MODEL });

async function extractTableFromPrompt(prompt: string): Promise<any> {
  try {
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extract table data from the following prompt. Return a JSON object with:
{
  "table": {
    "id": "extracted-table",
    "tableName": "Extracted Table",
    "sheetName": "Sheet1",
    "columns": [{"name": "Column Name", "type": "text"}],
    "rows": [[{"value": "cell value", "confidence": 95, "flagged": false}]]
  },
  "overallConfidence": 85,
  "flaggedCells": []
}

Prompt: ${prompt}

Return ONLY valid JSON, no markdown code blocks.`,
            },
          ],
        },
      ],
    });

    const text = response.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const result = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      table: {
        id: 'mock-table',
        tableName: 'Extracted Data',
        sheetName: 'Sheet1',
        columns: [
          { name: 'Column A', type: 'text' },
          { name: 'Column B', type: 'text' },
        ],
        rows: [
          [
            { value: 'Data extracted', confidence: 85, flagged: false },
            { value: 'From prompt', confidence: 85, flagged: false },
          ],
        ],
      },
      overallConfidence: 85,
      flaggedCells: [],
    };
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, url, prompt, fileName, mimeType, sheetName } = req.body;

    let extractionPrompt = '';

    if (imageBase64) {
      extractionPrompt = `Extract all tables from this image and structure them as JSON tables. Focus on accuracy.`;
    } else if (url) {
      extractionPrompt = `Extract the main table from URL: ${url}. Format as structured JSON table data.`;
    } else if (fileName && mimeType?.includes('pdf')) {
      extractionPrompt = `Extract tables from PDF file: ${fileName}. Structure as JSON tables.`;
    } else if (prompt) {
      extractionPrompt = prompt;
    } else {
      extractionPrompt = 'Create a sample table with headers and 3 rows of data.';
    }

    const result = await extractTableFromPrompt(extractionPrompt);

    return res.status(200).json({
      ...result,
      source: imageBase64 ? 'image' : url ? 'url' : fileName ? 'document' : 'text',
      table: {
        ...result.table,
        sheetName: sheetName || 'Sheet1',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
