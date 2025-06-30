# V11.1 Standard Dockerfile for a Monorepo Service
FROM node:18-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /usr/src/app

COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY turbo.json .
COPY tsconfig.base.json .

# Copy source code and package.json for the service and its dependencies
COPY services/dialogue-service/package.json ./services/dialogue-service/
COPY services/dialogue-service/src ./services/dialogue-service/src
COPY services/dialogue-service/tsconfig*.json ./services/dialogue-service/

# Copy all packages it depends on
COPY packages/config-service/ ./packages/config-service/
COPY packages/database/ ./packages/database/
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/tools/ ./packages/tools/

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@2dots1line/dialogue-service

# --- Release Stage ---
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy only the necessary built files and production dependencies
COPY --from=builder /usr/src/app/services/dialogue-service/dist ./dist
COPY --from=builder /usr/src/app/services/dialogue-service/package.json .
RUN corepack enable && pnpm install --prod

# The port should be exposed via docker-compose.yml or cloud-run config
# EXPOSE 3002

CMD ["node", "dist/server.js"] 