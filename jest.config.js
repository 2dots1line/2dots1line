module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.spec.tsx'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**'
  ],
  moduleNameMapper: {
    '^@2dots1line/(.*)$': '<rootDir>/packages/$1/src',
  },
  testTimeout: 30000,
  verbose: true
};
