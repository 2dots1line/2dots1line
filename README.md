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