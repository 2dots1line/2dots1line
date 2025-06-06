# 2dots1line V4 Monorepo Troubleshooting Guide

This guide provides solutions for common issues encountered when working with the 2dots1line V4 monorepo.

## Common Issues and Solutions

### Package Management Issues

#### EJSONPARSE Errors

**Symptom**: `EJSONPARSE` errors when running npm commands.

**Cause**: JSON files (e.g., `package.json`) contain comments or syntax errors.

**Solution**:
- Remove all comments from JSON files
- Validate JSON syntax using a linter or online tool
- Ensure all quotes and commas are properly formatted

#### EUNSUPPORTEDPROTOCOL Errors with Workspace References

**Symptom**: `EUNSUPPORTEDPROTOCOL` errors when using `workspace:*` in package.json dependencies.

**Cause**: Different versions of npm have varying levels of support for the workspace protocol syntax.

**Solution**:
1. Use npm-style workspace references:
   ```json
   "dependencies": {
     "@2dots1line/shared-types": "npm:^0.1.0"
   }
   ```
   
2. Create a `.npmrc` file at the repo root with:
   ```
   node-linker=hoisted
   strict-peer-dependencies=false
   public-hoist-pattern[]=*
   shared-workspace-lockfile=false
   ```

3. For more reliable workspace management, consider switching to pnpm or Yarn.

### Jest Testing Issues

#### "Cannot find module" Errors

**Symptom**: `Cannot find module '../src/xyz'` errors when running Jest tests.

**Cause**: Jest's module resolution is misaligned with the source directory structure or TypeScript's path configuration.

**Solution**:
1. Fix import paths in test files:
   ```typescript
   // INCORRECT
   import { Something } from '../src/module';
   
   // CORRECT
   import { Something } from '../module';
   ```

2. Update Jest configuration:
   ```javascript
   // jest.config.js
   const { pathsToModuleNameMapper } = require('ts-jest');
   const { compilerOptions } = require('../../tsconfig.base.json');
   
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     moduleDirectories: ['node_modules', '<rootDir>/../../node_modules'],
     moduleNameMapper: {
       ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/../../' }),
       // Add specific module mappings here
     }
   };
   ```

#### TypeScript Path Resolution Issues

**Symptom**: TypeScript compiler finds modules, but Jest cannot resolve them.

**Cause**: Mismatch between TypeScript path configurations and Jest module resolution.

**Solution**:
1. Ensure consistent `paths` in `tsconfig.base.json` at the root:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@2dots1line/*": ["packages/*/src"]
       }
     }
   }
   ```

2. Add project references in package-level tsconfig.json:
   ```json
   {
     "references": [
       { "path": "../shared-types" }
     ]
   }
   ```

3. Use `pathsToModuleNameMapper` in Jest config (as shown above).

### Build Order Issues

**Symptom**: Packages fail to build because they depend on other packages that haven't been built yet.

**Cause**: Turborepo task dependencies are not properly configured.

**Solution**:
1. Configure build dependencies in turbo.json:
   ```json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"]
       },
       "test": {
         "dependsOn": ["^build", "build"]
       }
     }
   }
   ```

2. Add explicit workspace references in package.json files.

3. Run `turbo prune` if needed to clean up the dependency graph.

## Preventative Measures

To avoid common issues with the monorepo:

1. **Use Consistent Import Patterns**:
   - Always use the same import style throughout the codebase
   - Follow the source directory structure in import paths

2. **Test Configuration Consistency**:
   - Use a base Jest configuration that's extended by each package
   - Configure TypeScript paths and Jest module mapping in sync

3. **Monorepo Hygiene**:
   - Regularly clean node_modules with `npm run clean`
   - Check for circular dependencies
   - Ensure each package has a clear, single responsibility

## Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Jest with TypeScript](https://kulshekhar.github.io/ts-jest/)
- [Effective TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) 