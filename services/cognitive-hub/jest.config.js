/** @type {import('jest').Config} */
module.exports = {
  displayName: 'cognitive-hub',
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@2dots1line/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@2dots1line/database$': '<rootDir>/../../packages/database/src',
    '^@2dots1line/tool-registry$': '<rootDir>/../../packages/tool-registry/src',
    '^@2dots1line/agent-framework$': '<rootDir>/../../packages/agent-framework/src',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
  ],
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
}; 