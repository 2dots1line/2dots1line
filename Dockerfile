FROM node:18-alpine AS base
WORKDIR /app

# Install pnpm and PM2
RUN npm install -g pnpm pm2

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json turbo.json ./

# Copy all package.json files for workspace
COPY packages/*/package.json ./packages/
COPY services/*/package.json ./services/
COPY workers/*/package.json ./workers/
COPY apps/*/package.json ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/ ./packages/
COPY services/ ./services/
COPY workers/ ./workers/
COPY apps/ ./apps/
COPY config/ ./config/
COPY scripts/deployment/ecosystem.config.js ./

# Build the entire monorepo (just like local development)
RUN pnpm build

# Expose all ports
EXPOSE 3000 3001 3002 7474 7687 8080 8000

# Default command (can be overridden)
CMD ["pm2-runtime", "start", "ecosystem.config.js"]