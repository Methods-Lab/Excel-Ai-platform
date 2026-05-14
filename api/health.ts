import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

  res.status(200).json({
    status: 'ok',
    model: GEMINI_MODEL,
    timestamp: new Date().toISOString(),
  });
};
