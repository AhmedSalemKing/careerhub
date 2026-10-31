/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^next/server$': '<rootDir>/__mocks__/next-server.ts',
  },
  transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: { strict: false, esModuleInterop: true } }],
  },
}
