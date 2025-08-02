/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  projects: [
    // Node.js environment for API tests
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/server/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/__tests__/performance/**/*.test.[jt]s?(x)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/src/server/api/__tests__/setup.ts'],
    },
    // jsdom environment for React component tests
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/features/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/pages/**/__tests__/**/*.test.[jt]s?(x)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^~/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
};

module.exports = config;