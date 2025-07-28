/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.js',
    '!src/**/*.d.ts',
    '!src/generated/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 180000, // 3분 타임아웃
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  // CI 환경에서 DB 테스트 제외 및 안전 설정
  testPathIgnorePatterns: (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') ? [
    '/node_modules/',
    'dbCodeGenerator.test.ts',
    'database.test.ts',
    'prisma.test.ts'
  ] : ['/node_modules/'],
  // 환경 변수 설정
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  // CI 환경에서 추가 안전 설정
  ...(process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' ? {
    maxWorkers: 1,
    bail: false,
    passWithNoTests: true,
    silent: false,
    errorOnDeprecated: false
  } : {})
}; 