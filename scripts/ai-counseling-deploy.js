#!/usr/bin/env node

/**
 * 🧠 WizCoCo AI 심리상담 시스템 전용 배포 스크립트
 * 4단계 심리검사 프로그램 및 상담사 관리 시스템 배포
 * 
 * 전문가 팀 협업으로 개발:
 * - 풀스택 프로그래머 1: 백엔드 API 및 데이터베이스 관리
 * - 풀스택 프로그래머 2: 프론트엔드 UI/UX 및 사용자 경험
 * - 웹 디자이너 1: UI/UX 디자인 및 사용자 인터페이스
 * - 웹 디자이너 2: 브랜딩 및 시각적 아이덴티티
 * - 심리상담가 1: 심리 테스트 내용 및 상담 프로그램 설계
 * - 심리상담가 2: 사용자 경험 및 상담 프로세스 최적화
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 로그 함수
function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// AI 심리상담 시스템 배포 함수
async function deployAiCounselingSystem() {
  log('🧠 AI 심리상담 시스템 배포 시작!', 'bright');
  log('=====================================', 'magenta');
  
  try {
    // 1단계: AI 시스템 파일 검증
    log('📋 1단계: AI 시스템 파일 검증', 'cyan');
    await validateAiSystemFiles();
    
    // 2단계: 데이터베이스 스키마 검증
    log('📋 2단계: 데이터베이스 스키마 검증', 'cyan');
    await validateDatabaseSchema();
    
    // 3단계: API 라우트 검증
    log('📋 3단계: API 라우트 검증', 'cyan');
    await validateApiRoutes();
    
    // 4단계: 컴포넌트 검증
    log('📋 4단계: 컴포넌트 검증', 'cyan');
    await validateComponents();
    
    // 5단계: Git 상태 확인 및 커밋
    log('📋 5단계: Git 상태 확인 및 커밋', 'cyan');
    await commitAiSystemChanges();
    
    // 6단계: GitHub 푸시
    log('📋 6단계: GitHub 푸시', 'cyan');
    await pushToGitHub();
    
    // 7단계: 배포 상태 확인
    log('📋 7단계: 배포 상태 확인', 'cyan');
    await checkDeploymentStatus();
    
    log('🎉 AI 심리상담 시스템 배포 완료!', 'bright');
    log('=====================================', 'green');
    
  } catch (error) {
    log('❌ AI 심리상담 시스템 배포 실패', 'red');
    log(`🔍 오류 상세: ${error.message}`, 'red');
    process.exit(1);
  }
}

// AI 시스템 파일 검증
async function validateAiSystemFiles() {
  log('🔍 AI 시스템 파일 검증 중...', 'blue');
  
  const requiredFiles = [
    'src/app/ai-counseling-system/page.tsx',
    'src/app/ai-counseling-system/holistic-self-check/page.tsx',
    'src/app/ai-counseling-system/focused-exploration/page.tsx',
    'src/app/ai-counseling-system/strength-discovery/page.tsx',
    'src/app/ai-counseling-system/counseling-blueprint/page.tsx',
    'src/app/ai-counseling-system/counselor-dashboard/page.tsx',
    'src/app/ai-counseling-system/risk-monitoring/page.tsx',
    'src/types/ai-counseling.ts',
    'src/lib/database/ai-counseling-schema.sql',
    'src/lib/database/ai-counseling-db.ts',
    'src/lib/reporting/integrated-report-generator.ts'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    log('❌ 누락된 파일들:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    throw new Error('AI 심리상담 시스템 필수 파일이 누락되었습니다.');
  }
  
  log('✅ 모든 AI 시스템 파일이 존재합니다', 'green');
}

// 데이터베이스 스키마 검증
async function validateDatabaseSchema() {
  log('🔍 데이터베이스 스키마 검증 중...', 'blue');
  
  const schemaFile = 'src/lib/database/ai-counseling-schema.sql';
  
  if (!fs.existsSync(schemaFile)) {
    throw new Error('AI 심리상담 시스템 데이터베이스 스키마 파일이 없습니다.');
  }
  
  const schemaContent = fs.readFileSync(schemaFile, 'utf8');
  
  const requiredTables = [
    'assessment_programs',
    'risk_signals',
    'counseling_sessions',
    'assessment_results',
    'ai_chat_sessions'
  ];
  
  const missingTables = [];
  
  for (const table of requiredTables) {
    if (!schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      missingTables.push(table);
    }
  }
  
  if (missingTables.length > 0) {
    log('❌ 누락된 테이블들:', 'red');
    missingTables.forEach(table => log(`  - ${table}`, 'red'));
    throw new Error('AI 심리상담 시스템 필수 데이터베이스 테이블이 누락되었습니다.');
  }
  
  log('✅ 데이터베이스 스키마가 올바르게 구성되었습니다', 'green');
}

// API 라우트 검증
async function validateApiRoutes() {
  log('🔍 API 라우트 검증 중...', 'blue');
  
  const requiredApiRoutes = [
    'src/app/api/ai-counseling/assessment/route.ts',
    'src/app/api/ai-counseling/risk-signals/route.ts',
    'src/app/api/ai-counseling/dashboard/route.ts',
    'src/app/api/ai-counseling/chat/route.ts',
    'src/app/api/ai-counseling/reports/route.ts'
  ];
  
  const missingRoutes = [];
  
  for (const route of requiredApiRoutes) {
    if (!fs.existsSync(route)) {
      missingRoutes.push(route);
    }
  }
  
  if (missingRoutes.length > 0) {
    log('❌ 누락된 API 라우트들:', 'red');
    missingRoutes.forEach(route => log(`  - ${route}`, 'red'));
    throw new Error('AI 심리상담 시스템 필수 API 라우트가 누락되었습니다.');
  }
  
  log('✅ 모든 API 라우트가 존재합니다', 'green');
}

// 컴포넌트 검증
async function validateComponents() {
  log('🔍 컴포넌트 검증 중...', 'blue');
  
  // Navigation.tsx에 AI 심리상담 시스템 메뉴가 포함되어 있는지 확인
  const navigationFile = 'src/components/Navigation.tsx';
  
  if (!fs.existsSync(navigationFile)) {
    throw new Error('Navigation.tsx 파일이 없습니다.');
  }
  
  const navigationContent = fs.readFileSync(navigationFile, 'utf8');
  
  if (!navigationContent.includes('AI 심리상담 시스템')) {
    throw new Error('Navigation.tsx에 AI 심리상담 시스템 메뉴가 포함되지 않았습니다.');
  }
  
  if (!navigationContent.includes('aiCounselingSystemMenuData')) {
    throw new Error('Navigation.tsx에 AI 심리상담 시스템 메뉴 데이터가 포함되지 않았습니다.');
  }
  
  log('✅ Navigation 컴포넌트가 올바르게 구성되었습니다', 'green');
}

// AI 시스템 변경사항 커밋
async function commitAiSystemChanges() {
  log('💾 AI 심리상담 시스템 변경사항 커밋 중...', 'blue');
  
  try {
    // Git 상태 확인
    const status = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 15000
    });
    
    if (!status.trim()) {
      log('✅ 변경사항이 없습니다', 'green');
      return;
    }
    
    const fileCount = status.trim().split('\n').length;
    log(`📝 ${fileCount}개 파일의 변경사항 발견`, 'yellow');
    
    // 변경사항 스테이징
    execSync('git add .', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log('✅ 변경사항 스테이징 완료', 'green');
    
    // AI 시스템 전용 커밋 메시지 생성
    const commitMessage = generateAiSystemCommitMessage();
    log(`📝 커밋 메시지: ${commitMessage}`, 'cyan');
    
    // 커밋 실행
    execSync(`git commit -m "${commitMessage}"`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log('✅ AI 심리상담 시스템 커밋 완료', 'green');
    
  } catch (error) {
    log(`❌ 커밋 실패: ${error.message}`, 'red');
    throw error;
  }
}

// AI 시스템 전용 커밋 메시지 생성
function generateAiSystemCommitMessage() {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('ko-KR', { 
    hour12: false, 
    timeZone: 'Asia/Seoul' 
  });
  
  return `🧠 AI 심리상담 시스템 배포 - ${timestamp} ${time}

✨ 새로운 기능:
- 4단계 심리검사 프로그램 구현
- 상담사 대시보드 및 내담자 관리 시스템
- AI 위험신호 감지 및 개입 시스템
- 통합 보고서 생성 시스템
- 실시간 AI 채팅 상담 기능

🔧 기술적 개선:
- 데이터베이스 스키마 최적화
- API 라우트 구조화
- TypeScript 타입 안전성 강화
- 사용자 인터페이스 개선

📊 배포 통계:
- 총 페이지: 7개
- API 엔드포인트: 5개
- 데이터베이스 테이블: 5개
- 컴포넌트: 1개 (Navigation 업데이트)`;
}

// GitHub 푸시
async function pushToGitHub() {
  log('🚀 GitHub 푸시 중...', 'blue');
  
  try {
    execSync('git push origin main', { 
      stdio: 'pipe',
      cwd: process.cwd(),
      timeout: 120000
    });
    log('✅ GitHub 푸시 완료', 'green');
  } catch (error) {
    log(`❌ GitHub 푸시 실패: ${error.message}`, 'red');
    throw error;
  }
}

// 배포 상태 확인
async function checkDeploymentStatus() {
  log('🔍 배포 상태 확인 중...', 'blue');
  
  log('📊 GitHub Actions가 자동으로 실행됩니다', 'green');
  log('🌐 Actions URL: https://github.com/jomigata/wiz-coco/actions', 'cyan');
  log('🌐 배포된 사이트: https://wiz-coco.web.app', 'cyan');
  
  log('🎯 AI 심리상담 시스템 주요 기능:', 'magenta');
  log('  - 통합 자기 점검 (Holistic Self-Check)', 'yellow');
  log('  - 집중 탐색 모듈 (Focused Exploration)', 'yellow');
  log('  - 강점 및 자원 탐색 (Strength Discovery)', 'yellow');
  log('  - 상담 청사진 (Counseling Blueprint)', 'yellow');
  log('  - 상담사 대시보드 (Counselor Dashboard)', 'yellow');
  log('  - 위험신호 모니터링 (Risk Monitoring)', 'yellow');
  
  log('🔍 다음 단계:', 'cyan');
  log('  1. 배포된 사이트에서 AI 심리상담 시스템 접근', 'yellow');
  log('  2. 4단계 심리검사 프로그램 테스트', 'yellow');
  log('  3. 상담사 대시보드 기능 확인', 'yellow');
  log('  4. AI 위험신호 감지 시스템 테스트', 'yellow');
}

// 메인 실행
if (require.main === module) {
  deployAiCounselingSystem().catch(error => {
    log('❌ AI 심리상담 시스템 배포 실패', 'red');
    log(`🔍 오류 상세: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { 
  deployAiCounselingSystem,
  validateAiSystemFiles,
  validateDatabaseSchema,
  validateApiRoutes,
  validateComponents
};
