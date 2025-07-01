# 2dots1line V4 Monorepo

This is the monorepo for the 2dots1line Memory System V4 implementation.

## Structure

The project is organized as a monorepo with the following structure:

- `apps/`: Application implementations (web-app, mobile-app, backend-api)
- `packages/`: Shared code libraries (shared-types, database, ai-clients, etc.)
- `services/`: Cognitive agents and tools (dialogue-agent, ingestion-analyst, etc.)
- `workers/`: Background workers (ingestion-worker, embedding-worker, etc.)
- `config/`: Global configuration (eslint, prettier, jest, etc.)
- `scripts/`: Utility scripts (setup, migration, monitoring)

## Setup

### Prerequisites

- Node.js (v18+)
- npm (v10+)

### Install dependencies

```bash
npm install
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
2. Regenerate Prisma client: `cd packages/database && pnpm db:generate`
3. Check database connections in logs 