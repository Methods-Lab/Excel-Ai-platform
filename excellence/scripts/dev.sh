#!/bin/bash
set -e
echo "Starting Excellence development environment..."

cd services/api
uvicorn main:app --port 8745 --reload &
API_PID=$!

cd ../ocr-service
uvicorn main:app --port 5555 --reload &
OCR_PID=$!

cd ../..
sleep 3
pnpm --filter shell dev &
ELECTRON_PID=$!

trap "echo 'Shutting down...'; kill $API_PID $OCR_PID $ELECTRON_PID 2>/dev/null" EXIT INT TERM
wait $ELECTRON_PID
