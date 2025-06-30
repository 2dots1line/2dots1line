# ===================================================================
# V11.2 Monorepo Root Dockerfile
# This Dockerfile builds any Node.js service/worker in the monorepo
# by passing APP_NAME as a build argument.
# ===================================================================

# --- Stage 1: Base ---
# Installs dependencies for all workspaces. This layer is cached and
# only re-runs if the lockfile changes.
FROM node:18-alpine AS base
WORKDIR /app

# Copy only the files needed to install dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install pnpm and then install all dependencies.
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# --- Stage 2: Builder ---
# Copies all source code and uses Turborepo to build everything.
FROM base AS builder
WORKDIR /app

# Copy the rest of the monorepo source code.
COPY . .

# Use Turborepo to build all applications and packages.
# This is efficient because it respects the dependency graph and caches outputs.
RUN pnpm turbo run build

# --- Stage 3: Production Image ---
# Creates the final, lean image for a specific service.
FROM node:18-alpine

# This argument is passed in from docker-compose.yml
ARG APP_NAME

WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary production node_modules from the base stage.
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=base /app/package.json ./package.json

# Copy the centralized config directory.
COPY --from=builder /app/config ./config

# Copy the built output ('dist') and package.json for the specific service.
# We'll try all three possible locations (apps, services, workers) and copy whichever exists.
RUN mkdir -p ./dist ./temp
COPY --from=builder /app/apps/${APP_NAME}/dist ./temp/dist 2>/dev/null || true
COPY --from=builder /app/services/${APP_NAME}/dist ./temp/dist 2>/dev/null || true  
COPY --from=builder /app/workers/${APP_NAME}/dist ./temp/dist 2>/dev/null || true
RUN cp -r ./temp/dist/* ./dist/ 2>/dev/null || true

COPY --from=builder /app/apps/${APP_NAME}/package.json ./app_package.json 2>/dev/null || true
COPY --from=builder /app/services/${APP_NAME}/package.json ./app_package.json 2>/dev/null || true
COPY --from=builder /app/workers/${APP_NAME}/package.json ./app_package.json 2>/dev/null || true
RUN cp ./app_package.json ./package.json 2>/dev/null || true

# Clean up temporary files
RUN rm -rf ./temp ./app_package.json

# The 'start' script is defined in each service's package.json.
# This command tells pnpm to run the 'start' script for the specific app.
CMD ["pnpm", "--filter", "@2dots1line/${APP_NAME}", "start"]