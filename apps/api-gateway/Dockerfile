# V11.1 Standard Dockerfile for a Monorepo Service
# --- 1. Builder Stage: Build the application ---
FROM node:18-alpine AS builder

# Tell pnpm where to find the root of the workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app

# Copy root configurations and package manifests
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY turbo.json .
COPY tsconfig.base.json .

# Copy source code and package.json for all dependencies of api-gateway
# This is necessary for `pnpm install` to work correctly.
# First, the api-gateway app itself
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/api-gateway/src/ ./apps/api-gateway/src
COPY apps/api-gateway/tsconfig*.json ./apps/api-gateway/

# Now, its dependencies from the `packages` directory
COPY packages/database/package.json ./packages/database/
COPY packages/database/src ./packages/database/src
COPY packages/database/prisma ./packages/database/prisma
COPY packages/database/tsconfig*.json ./packages/database/

COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-types/src ./packages/shared-types/src
COPY packages/shared-types/tsconfig*.json ./packages/shared-types/

COPY packages/tool-registry/package.json ./packages/tool-registry/
COPY packages/tool-registry/src ./packages/tool-registry/src
COPY packages/tool-registry/tsconfig*.json ./packages/tool-registry/

COPY packages/tools/package.json ./packages/tools/
COPY packages/tools/src ./packages/tools/src
COPY packages/tools/tsconfig*.json ./packages/tools/

# Install all dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Now we can run the build for just our target application
# Turborepo will automatically build all of its dependencies first.
RUN pnpm turbo build --filter=@2dots1line/api-gateway


# --- 2. Release Stage: Create the final, lean image ---
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy only the necessary built files and production dependencies from the builder
COPY --from=builder /usr/src/app/apps/api-gateway/dist ./dist
COPY --from=builder /usr/src/app/apps/api-gateway/package.json .
# Use pnpm to install only production dependencies
RUN corepack enable && pnpm install --prod

EXPOSE 3001

# The `rootDir` is "src", so the output is `dist/server.js`
CMD ["node", "dist/server.js"] 