# Multi-stage build for API Gateway in monorepo
FROM node:18-alpine As builder

# Set working directory to the monorepo root
WORKDIR /usr/src/app

# Copy package.json files from root and relevant packages
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/tool-registry/package*.json ./packages/tool-registry/
COPY packages/agent-framework/package*.json ./packages/agent-framework/
COPY services/cognitive-hub/package*.json ./services/cognitive-hub/
COPY apps/api-gateway/package*.json ./apps/api-gateway/

# Install all dependencies at root level
RUN npm install

# Copy tsconfig files
COPY tsconfig.base.json ./
COPY packages/database/tsconfig.json ./packages/database/
COPY packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/tool-registry/tsconfig.json ./packages/tool-registry/
COPY packages/agent-framework/tsconfig.json ./packages/agent-framework/
COPY services/cognitive-hub/tsconfig.json ./services/cognitive-hub/
COPY apps/api-gateway/tsconfig.json ./apps/api-gateway/

# Copy source code for packages that api-gateway depends on
COPY packages/database/ ./packages/database/
COPY packages/shared-types/ ./packages/shared-types/
COPY packages/tool-registry/ ./packages/tool-registry/
COPY packages/agent-framework/ ./packages/agent-framework/
COPY services/cognitive-hub/ ./services/cognitive-hub/

# Generate Prisma client first
RUN cd packages/database && npx prisma generate

# Build the database package
RUN cd packages/database && npm run build

# Build shared-types package
RUN cd packages/shared-types && npm run build

# Build tool-registry package
RUN cd packages/tool-registry && npm run build

# Build agent-framework package
RUN cd packages/agent-framework && npm run build

# Build cognitive-hub service
RUN cd services/cognitive-hub && npm run build

# Copy api-gateway source and build it
COPY apps/api-gateway/ ./apps/api-gateway/
RUN cd apps/api-gateway && npm run build

# --- Release Stage ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy the entire built workspace
COPY --from=builder /usr/src/app ./

# Set working directory to api-gateway
WORKDIR /usr/src/app/apps/api-gateway

# Expose the port
EXPOSE 3001

# Start the application
CMD ["node", "dist/src/server.js"] 