# 2dots1line V11.0 Monorepo

A comprehensive AI-powered platform with dialogue agents, knowledge management, and insight generation capabilities.

## Quick Start (V11.0 Architecture)

### Prerequisites
- Node.js 18+ with pnpm
- Docker & Docker Compose
- PM2 (install with: `pnpm add -g pm2`)

### Complete Setup Process

```bash
# 1. Clone and setup
git clone <repository>
cd 2D1L

# 2. Install dependencies and setup
pnpm setup

# 3. Build all packages
pnpm build

# 4. Start database containers
docker-compose -f docker-compose.dev.yml up -d

# 5. Start all services via PM2
pm2 start ecosystem.config.js

# 6. Monitor services
pm2 status
pm2 logs
```

### V11.0 Architecture Overview

**Single API Gateway + Headless Services + PM2 Workers**
- `apps/api-gateway`: Single HTTP entry point (port 3001)
- `services/`: Pure business logic libraries (no HTTP servers)
- `workers/`: Background job processors managed by PM2
- `packages/`: Shared utilities and types

### Development Workflow

```bash
# Clean rebuild everything
pnpm clean-install  # or pnpm setup
pnpm build

# Start databases only
docker-compose -f docker-compose.dev.yml up -d

# Start/restart all services
pm2 restart ecosystem.config.js

# Monitor specific service
pm2 logs api-gateway
pm2 logs ingestion-worker

# Stop all services
pm2 delete all

# Stop databases
docker-compose -f docker-compose.dev.yml down
```

### Testing the Core Loop

The **dialogue agent → ingestion analyst** loop is the critical path:

1. **Create conversation** via API Gateway
2. **Send message** triggers DialogueAgent 
3. **DialogueAgent** queues job for IngestionAnalyst
4. **IngestionWorker** processes ingestion analysis
5. **Results** stored in PostgreSQL/Neo4j

Test endpoints:
```bash
# Health check
curl http://localhost:3001/api/v1/health

# Create conversation
curl -X POST http://localhost:3001/api/v1/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user"}'

# Send message (triggers the loop)
curl -X POST http://localhost:3001/api/v1/conversations/{id}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Analyze this business data..."}'
```

### Troubleshooting

**Common Issues:**
- `prisma: command not found` → Run `pnpm setup` 
- PM2 script not found → Ensure `pnpm build` completed
- Database connection errors → Check `docker-compose -f docker-compose.dev.yml ps`

**Build Structure:**
- Most workers: `dist/src/index.js`
- Some workers: `dist/index.js`
- API Gateway: `dist/server.js`

### Package Scripts

## V11.0 Architecture: Single API Gateway + Headless Services

**V11.0** transformed from multiple HTTP microservices to a **single API Gateway** with **headless service libraries** for better performance and maintainability.

## Structure

The project is organized as a monorepo with the following structure:

- `apps/`: Applications (api-gateway, web-app)
- `packages/`: Shared libraries (shared-types, database, ai-clients, ui-components, etc.)
- `services/`: **Headless service libraries** (user-service, card-service, dialogue-service, etc.)
- `workers/`: Background workers (ingestion-worker, embedding-worker, etc.)
- `config/`: Global configuration and operational parameters
- `py-services/`: Python microservices (dimension-reducer)

## Quick Setup

### Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- Docker & Docker Compose

### Complete Setup (Recommended)

```bash
# One command setup - installs deps, generates Prisma client, builds everything
pnpm setup
```

### Manual Setup

```bash
# Install all dependencies
pnpm install

# Generate Prisma client (automatically done in postinstall)
pnpm db:generate

# Build all packages
pnpm build
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Test

```bash
npm run test
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Documentation

Refer to the following documents for detailed information:

- [V4 Technical Specification](../docs/V4TechSpec.md)
- [V4 Data Schema Design](../docs/V4DataSchemaDesign.md)
- [V4 Coding Standards](../docs/V4CodingStandards.md)
- [V4 Implementation Prompts](../docs/V4ImplementationPrompts.md)

## License

Proprietary and confidential.

# 2D1L - Development Setup

## Quick Start (Complete System)

1. **Start databases**: `docker-compose up postgres redis weaviate neo4j -d`
2. **Start backend services**: `pnpm services:start`  
3. **Start web app**: `cd apps/web-app && pnpm dev`
4. **Open**: http://localhost:3000

## Service Management

- **Start all backend services**: `pnpm services:start`
- **Stop all backend services**: `pnpm services:stop`
- **Restart services**: `pnpm services:restart`
- **Full development mode**: `pnpm dev:full` (starts services + web app)

## Service Ports

- **Web App**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Dialogue Service**: http://localhost:3002
- **User Service**: http://localhost:3003
- **Card Service**: http://localhost:3004
- **Prisma Studio**: http://localhost:5555

## Troubleshooting

### Authentication Issues
1. Verify all services are running: `curl http://localhost:300{1,2,3,4}/api/health`
2. Check service logs: `tail -f logs/*.log`
3. Restart services: `pnpm services:restart`

### Database Issues
1. Ensure Docker databases are running: `docker ps`
2. Regenerate Prisma client: `pnpm db:generate`
3. Check database connections in logs

### Prisma Setup (Fixed Systematically)

**Problem**: After `pnpm install`, Prisma commands failed with "prisma: command not found"

**Solution**: The database package now includes:
- ✅ `prisma` CLI in devDependencies 
- ✅ `postinstall` script that auto-generates Prisma client
- ✅ Root-level `pnpm setup` command for complete setup

**Commands that always work now**:
```bash
# Complete setup (recommended for new clones)
pnpm setup

# Just regenerate Prisma client
pnpm db:generate

# Manual database operations
pnpm --filter @2dots1line/database db:migrate:dev
pnpm --filter @2dots1line/database db:studio
``` 