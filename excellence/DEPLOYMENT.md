# Excel AI Platform - Deployment Guide

## What's Deployed

1. **Frontend**: React Vite app (production UI for table extraction)
2. **Backend API**: Vercel serverless functions with Gemini AI integration

## Pre-Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Authenticate with Vercel
```bash
vercel login
```

### 3. Configure Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add:
- `GEMINI_API_KEY`: Your Google Gemini API key
- `GEMINI_MODEL`: `gemini-1.5-flash` (or your preferred model)

### 4. Install Dependencies

From the `excellence/` directory:
```bash
npm install
```

## Deployment

### Deploy to Vercel

From the `excellence/` directory:

```bash
vercel --prod
```

Or link to an existing project:
```bash
vercel link
vercel --prod
```

### Verify Deployment

1. Frontend should be live at your Vercel URL (e.g., `https://your-app.vercel.app`)
2. API endpoints available at:
   - `https://your-app.vercel.app/api/extract-table` (POST)
   - `https://your-app.vercel.app/api/query` (POST)
   - `https://your-app.vercel.app/api/health` (GET)

## Testing the Deployment

### Test API Endpoints

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test extraction
curl -X POST https://your-app.vercel.app/api/extract-table \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a table with product names and prices"}'

# Test chat query
curl -X POST https://your-app.vercel.app/api/query \
  -H "Content-Type: application/json" \
  -d '{"text":"How do I extract data from an image?"}'
```

### Test the Frontend

1. Open `https://your-app.vercel.app`
2. Use the UI to:
   - Upload images for table extraction
   - Paste URLs to scrape tables
   - Enter text prompts to generate tables
   - Chat with the AI assistant

## Troubleshooting

### API Returns 500 Errors
- Check that GEMINI_API_KEY is set in Vercel environment variables
- Verify the API key is valid and has sufficient quota

### Frontend Can't Connect to API
- Check browser console for CORS errors
- Verify the API URL in Vercel deployment logs
- Ensure API functions are deployed successfully

### Cold Start Issues
- First request to serverless functions may take 5-10 seconds
- Subsequent requests are faster

## Local Development

To test locally before deploying:

```bash
# Start frontend dev server
npm run dev -w @excel-ai-platform/renderer

# The frontend will attempt to call:
# - Electron IPC (if running Electron)
# - Local API at http://localhost:8745
# - Or use mock IPC if VITE_ENABLE_MOCK_IPC=true

# To test with mock data:
export VITE_ENABLE_MOCK_IPC=true
npm run dev -w @excel-ai-platform/renderer
```

## Production Build

```bash
npm run build
```

This builds all workspaces including the frontend.
