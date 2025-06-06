# @2dots1line/shared-types

This package contains shared TypeScript type definitions for the 2dots1line V4 system.

## Purpose

- Provide consistent type definitions across all packages in the monorepo
- Define entity models that match the database schema
- Define agent input/output contracts
- Define API request/response types

## Usage

```typescript
import { IUser, IMemoryUnit, IConcept, IChunk } from '@2dots1line/shared-types';

// Use the types in your code
const user: IUser = {
  userId: '123',
  email: 'user@example.com',
  // ...other properties
};
```

## Structure

- `entities/`: Core entity models (User, MemoryUnit, Chunk, Concept, etc.)
- `api/`: API request/response types
- `ai/`: Cognitive agent and tool interfaces
- `errors/`: Error types and interfaces

## Development

1. Make changes to the type definitions
2. Run `npm run build` to compile the TypeScript
3. Run `npm run test` to run tests
4. Run `npm run lint` to check for linting issues

## Dependencies

This package has no runtime dependencies, only development dependencies for TypeScript compilation and testing. 