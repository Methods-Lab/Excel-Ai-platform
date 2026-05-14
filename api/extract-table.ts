import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Always use gemini-pro for free tier compatibility
const GEMINI_MODEL = 'gemini-pro';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: GEMINI_MODEL });

async function extractTableFromPrompt(prompt: string): Promise<any> {
  try {
    console.log('Starting AI extraction with prompt:', prompt.substring(0, 100));
    
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a table extraction AI. Based on the user's request, create a structured table.

User request: ${prompt}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "table": {
    "id": "extracted-table",
    "tableName": "Extracted Table",
    "sheetName": "Sheet1",
    "columns": [{"name": "Column 1", "type": "text"}, {"name": "Column 2", "type": "text"}],
    "rows": [[{"value": "row1col1", "confidence": 90, "flagged": false}, {"value": "row1col2", "confidence": 90, "flagged": false}]]
  },
  "overallConfidence": 90,
  "flaggedCells": []
}

Make sure the table content directly matches what the user requested.`,
            },
          ],
        },
      ],
    });

    const text = response.response.text();
    console.log('AI Response:', text.substring(0, 200));
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    console.log('Parsed result:', result);
    return result;
  } catch (error) {
    console.error('AI extraction error:', error);
    throw error;
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
      return res.status(400).json({ error: 'No extraction source provided' });
    }

    console.log('Processing extraction with prompt:', extractionPrompt.substring(0, 100));
    
    const result = await extractTableFromPrompt(extractionPrompt);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Extract table error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract table',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
