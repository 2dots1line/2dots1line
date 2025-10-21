# syntax=docker/dockerfile:1

# ===================================================================
# V13.0 Production Dockerfile for Google Cloud (Simple & Robust)
# ===================================================================
# This Dockerfile prioritizes reliability over image size by including
# all node_modules in the final image.

# --- Single Stage Build ---
# This Dockerfile uses a single stage to prioritize reliability over image size
# by including all node_modules in the final image.
FROM node:20-slim

WORKDIR /app

# Set production environment
ENV PORT=8080

# Enable corepack and pin pnpm version
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy workspace manifests and source code
COPY . .

# Install all dependencies, including devDependencies
RUN pnpm install --frozen-lockfile

# Build the entire monorepo
RUN pnpm exec turbo run build

# Generate Prisma client
RUN pnpm --filter database exec prisma generate

# Expose the port the api-gateway will run on
EXPOSE 8080

# Start the api-gateway service
# The working directory is the monorepo root, so we need the full path to the service.
CMD ["node", "apps/api-gateway/dist/server.js"]