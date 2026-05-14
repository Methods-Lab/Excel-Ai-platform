import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const client = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = client.getGenerativeModel({ model: GEMINI_MODEL });

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
              text: `You are an Excel AI assistant helping users work with spreadsheets and data. Answer the following query:

${text}

Keep responses concise, helpful, and focused on Excel/data tasks.`,
            },
          ],
        },
      ],
    });

    const reply = response.response.text();

    return res.status(200).json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({ error: 'Failed to process query' });
  }
};
