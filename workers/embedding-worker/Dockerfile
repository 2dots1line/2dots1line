# syntax=docker/dockerfile:1

# ===================================================================
# Embedding Worker Dockerfile for Google Cloud Run
# ===================================================================

FROM node:20-slim

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Enable corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy workspace manifests and source code from parent directories
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../turbo.json ./
COPY ../../tsconfig.base.json ./

# Copy all packages and apps
COPY ../../packages ./packages
COPY ../../apps ./apps
COPY ../../workers ./workers
COPY ../../services ./services

# Install all dependencies, including devDependencies
RUN pnpm install --frozen-lockfile

# Build the entire monorepo
RUN pnpm exec turbo run build

# Generate Prisma client
RUN pnpm --filter database exec prisma generate

# Expose the port (required for Cloud Run)
EXPOSE 8080

# Start the embedding-worker
CMD ["node", "workers/embedding-worker/dist/index.js"]