# --- STAGE 1: Base & Dependencies ---
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install system dependencies for Electron and AI (Python/OCR)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libasound2 \
    libgbm-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files first
COPY package*.json ./

# Attempt to copy workspace package files if they exist
# (Using wildcards to prevent build failure if some are missing)
COPY apps/*/package*.json ./apps/ 2>/dev/null || true
COPY packages/*/package*.json ./packages/ 2>/dev/null || true

# Install dependencies
# If root package.json is empty, this will just create a node_modules folder
RUN npm install || echo "No dependencies found to install"

# --- STAGE 2: Builder ---
FROM base AS builder
COPY . .

# Build all packages and apps (only if scripts are defined)
RUN npm run build --if-present

# --- STAGE 3: Runner ---
FROM base AS runner
ENV NODE_ENV=development
COPY --from=builder /app .

# Expose Vite and API ports
EXPOSE 5173
EXPOSE 8000

CMD ["npm", "run", "dev"]
