const path = require('path');

// We define the absolute paths here so we KNOW they are correct
const root = __dirname; 
const coveragePath = path.resolve(root, 'coverage');
const nodeModulesPath = path.resolve(root, 'node_modules');
const distPath = path.resolve(root, 'dist');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Use the absolute paths we just created. 
  // No <rootDir> tokens, just raw strings from your OS.
  watchPathIgnorePatterns: [
    nodeModulesPath,
    coveragePath,
    distPath
  ],

  modulePathIgnorePatterns: [
    distPath
  ],

  testPathIgnorePatterns: [
    'node_modules',
    'integration'
  ],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!src/db/models/**',
    '!**/__tests__/**',
    '!src/db/seed.ts',
    '!src/db/seed-run.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 70,
      lines: 50,
      statements: 50
    }
    // (No per-path threshold — in watch when no tests run, coverage is empty and Jest
    // would error "Coverage data for ./src/**/*.ts was not found." Press `a` in watch to run all.)
  },
};