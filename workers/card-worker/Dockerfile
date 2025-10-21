# syntax=docker/dockerfile:1

# ===================================================================
# Card Worker Dockerfile for Google Cloud Run
# ===================================================================

FROM node:20-slim

WORKDIR /app

# Enable corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copy only necessary packages, services, and the specific worker
COPY packages ./packages
COPY services ./services
COPY workers/card-worker ./workers/card-worker

# Install dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Build all dependencies first, then the card-worker
RUN pnpm exec turbo run build --filter=@2dots1line/card-worker

# Generate Prisma client (if needed by the worker)
RUN pnpm --filter database exec prisma generate

# Remove devDependencies to reduce image size
RUN pnpm prune --prod

# Set production environment
ENV NODE_ENV=production

# Start the card-worker
CMD ["node", "workers/card-worker/dist/index.js"]