#!/bin/bash
set -e
echo "Setting up Excellence..."
pnpm install
cd services/api && pip install -r requirements.txt && cd ../..
cd services/ocr-service && pip install -r requirements.txt && cd ../..
[ ! -f .env ] && cp .env.example .env && echo "Created .env — add your GROQ_API_KEY"
echo "✅ Setup complete. Run: bash scripts/dev.sh"
