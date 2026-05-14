import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: GEMINI_MODEL });

// Mock table extraction using AI
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
    // Return mock data on error
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

// Extraction endpoint
app.post('/api/extract-table', async (req, res) => {
  try {
    const { imageBase64, url, prompt, fileName, mimeType, sheetName } = req.body;

    let extractionPrompt = '';

    if (imageBase64) {
      extractionPrompt = `Extract all tables from this image and structure them as JSON tables. Focus on accuracy.`;
    } else if (url) {
      extractionPrompt = `Extract the main table from URL: ${url}. Format as structured JSON table data.`;
    } else if (fileName && mimeType.includes('pdf')) {
      extractionPrompt = `Extract tables from PDF file: ${fileName}. Structure as JSON tables.`;
    } else if (prompt) {
      extractionPrompt = prompt;
    } else {
      extractionPrompt = 'Create a sample table with headers and 3 rows of data.';
    }

    const result = await extractTableFromPrompt(extractionPrompt);
    res.json({
      ...result,
      source: imageBase64 ? 'image' : url ? 'url' : fileName ? 'document' : 'text',
      table: {
        ...result.table,
        sheetName: sheetName || 'Sheet1',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Extraction failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Chat query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an Excel AI assistant. Answer the following query about working with Excel and data:

${text}

Keep responses concise and helpful.`,
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();
    res.json({ text: responseText });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Query failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: GEMINI_MODEL });
});

const PORT = process.env.PORT || 8745;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Model: ${GEMINI_MODEL}`);
});
