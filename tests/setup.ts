/**
 * Jest 테스트 설정 파일
 * 테스트 환경 초기화 및 전역 설정
 */

import '@testing-library/jest-dom';

// Jest 전역 함수들을 명시적으로 import
import { beforeAll, afterAll, describe, test, expect, jest } from '@jest/globals';

// 전역 타입 선언
declare global {
  namespace NodeJS {
    interface Global {
      beforeAll: typeof beforeAll;
      afterAll: typeof afterAll;
      describe: typeof describe;
      test: typeof test;
      expect: typeof expect;
    }
  }
}

// 전역 설정
global.console = {
  ...console,
  // 테스트 중 불필요한 로그 억제
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// 환경 변수 설정
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
process.env.SKIP_DB_INIT = 'true';

// window 객체 모킹 (클라이언트 사이드 테스트용)
Object.defineProperty(global, 'window', {
  value: {
    location: {
      pathname: '/tests/mbti_pro'
    }
  },
  writable: true
});

// fetch API 모킹
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      code: 'MP250-AA001',
      message: '테스트 코드 생성 성공'
    }),
  })
) as jest.Mock;

// 테스트 환경에서만 실행
if (typeof global !== 'undefined' && global.beforeAll) {
  // 환경 변수 설정
  if (!process.env.TEST_VERBOSE) {
    // 로그 출력 제어
    if (typeof jest !== 'undefined') {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'debug').mockImplementation(() => {});
      jest.spyOn(console, 'info').mockImplementation(() => {});
    }
  }
  
  // 테스트용 환경 변수 설정
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  }
  process.env.REDIS_HOST = process.env.TEST_REDIS_HOST || 'localhost';
  process.env.REDIS_PORT = process.env.TEST_REDIS_PORT || '6379';

  // 전역 변수 모킹
  const originalConsole = console;

  global.beforeAll(() => {
    // 테스트 환경 초기화
    if (!process.env.TEST_VERBOSE) {
      // 로그 출력 제어
      if (typeof jest !== 'undefined') {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'debug').mockImplementation(() => {});
        jest.spyOn(console, 'info').mockImplementation(() => {});
      }
    }
  });

  global.afterAll(async () => {
    // 리소스 정리
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // console 복원
    originalConsole.log = console.log;
    originalConsole.debug = console.debug;
    originalConsole.info = console.info;
  });
} 