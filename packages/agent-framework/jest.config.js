/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  displayName: 'agent-framework',
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^@2dots1line/tool-registry$': '<rootDir>/../tool-registry/src',
    '^@2dots1line/database$': '<rootDir>/../database/src',
    '^@2dots1line/shared-types$': '<rootDir>/../shared-types/src',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true, // Force isolated modules for ts-jest
      },
    ],
  },
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false, // Turn off coverage for now to simplify
  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8', 
}; 