// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
process.env.SKIP_DB_INIT = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// CI 환경 감지 및 강화
if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
  console.log('[Test Setup] CI 환경에서 테스트 실행');
  process.env.CI = 'true';
  process.env.GITHUB_ACTIONS = 'true';
  process.env.SKIP_DB_INIT = 'true';
  process.env.NODE_ENV = 'test';
  
  // CI 환경에서 추가 안전 설정
  process.env.PRISMA_DISABLE_WARNINGS = 'true';
  process.env.DISABLE_ERD = 'true';
  
  console.log('[Test Setup] CI 환경 변수 설정 완료');
} else {
  console.log('[Test Setup] 로컬 환경에서 테스트 실행');
}

// 전역 환경 변수 확인
console.log('[Test Setup] 환경 변수 확인:', {
  NODE_ENV: process.env.NODE_ENV,
  CI: process.env.CI,
  GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
  SKIP_DB_INIT: process.env.SKIP_DB_INIT,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET'
}); 