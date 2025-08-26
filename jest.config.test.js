module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'services/**/*.ts',
    'workers/**/*.ts',
    'packages/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@2dots1line/shared-types$': '<rootDir>/packages/shared-types/src',
    '^@2dots1line/database$': '<rootDir>/packages/database/src',
    '^@2dots1line/core-utils$': '<rootDir>/packages/core-utils/src',
    '^@2dots1line/tools$': '<rootDir>/packages/tools/src',
    '^@2dots1line/ai-clients$': '<rootDir>/packages/ai-clients/src',
    '^@2dots1line/tool-registry$': '<rootDir>/packages/tool-registry/src',
    '^@2dots1line/dialogue-service$': '<rootDir>/services/dialogue-service/src',
    '^@2dots1line/config-service$': '<rootDir>/services/config-service/src'
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 60000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: '__tests__/tsconfig.json'
    }]
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
}; 