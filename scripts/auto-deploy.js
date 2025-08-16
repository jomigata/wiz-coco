#!/usr/bin/env node

/**
 * 🚀 WizCoCo 완전 자동화 배포 스크립트
 * Cursor 에이전트가 사용자 개입 없이 자동으로 실행
 * 
 * 30년 경력 전문가 팀 협업으로 개발:
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

// 에러 처리 함수
function handleError(error, step) {
  log(`❌ ${step} 실패: ${error.message}`, 'red');
  log(`🔍 상세 오류: ${error.stack}`, 'red');
  process.exit(1);
}

// 명령어 실행 함수 (자동화)
function executeCommand(command, description, options = {}) {
  log(`🔄 ${description} 실행 중...`, 'blue');
  log(`📝 명령어: ${command}`, 'cyan');
  
  try {
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
      ...options
    });
    
    log(`✅ ${description} 완료`, 'green');
    if (result) {
      log(`📊 결과: ${result.trim()}`, 'cyan');
    }
    return result;
  } catch (error) {
    handleError(error, description);
  }
}

// Git 상태 확인 함수
function checkGitStatus() {
  log('🔍 Git 상태 확인 중...', 'blue');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!status.trim()) {
      log('✅ Git 작업 디렉토리가 깨끗합니다', 'green');
      return false; // 변경사항 없음
    }
    
    log('📝 변경사항 발견:', 'yellow');
    log(status, 'cyan');
    return true; // 변경사항 있음
  } catch (error) {
    log('⚠️ Git 상태 확인 실패, 계속 진행합니다', 'yellow');
    return true;
  }
}

// 자동 커밋 메시지 생성 함수
function generateCommitMessage() {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('ko-KR', { 
    hour12: false, 
    timeZone: 'Asia/Seoul' 
  });
  
  return `🚀 자동 배포 업데이트 - ${timestamp} ${time}`;
}

// 완전 자동화된 배포 프로세스
async function autoDeploy() {
  log('🚀 WizCoCo 완전 자동화 배포 시작!', 'bright');
  log('=====================================', 'blue');
  
  try {
    // 1단계: Git 상태 확인
    const hasChanges = checkGitStatus();
    
    if (!hasChanges) {
      log('ℹ️ 변경사항이 없어 배포를 건너뜁니다', 'yellow');
      return;
    }
    
    // 2단계: 모든 변경사항 스테이징 (자동)
    log('📦 변경사항 스테이징 중...', 'blue');
    executeCommand('git add .', 'Git 스테이징');
    
    // 3단계: 자동 커밋 (사용자 입력 없음)
    const commitMessage = generateCommitMessage();
    log('💾 자동 커밋 생성 중...', 'blue');
    executeCommand(`git commit -m "${commitMessage}"`, '자동 커밋');
    
    // 4단계: GitHub 푸시 (자동)
    log('🚀 GitHub 푸시 중...', 'blue');
    executeCommand('git push origin main', 'GitHub 푸시');
    
    // 5단계: 배포 상태 확인
    log('🔍 배포 상태 확인 중...', 'blue');
    log('📊 GitHub Actions가 자동으로 실행됩니다', 'green');
    log('🌐 Actions URL: https://github.com/jomigata/wiz-coco/actions', 'cyan');
    
    // 6단계: 배포 완료 대기 (선택적)
    if (process.argv.includes('--wait')) {
      log('⏳ 배포 완료 대기 중... (Ctrl+C로 중단 가능)', 'yellow');
      await waitForDeployment();
    }
    
    log('🎉 완전 자동화 배포 완료!', 'bright');
    log('=====================================', 'green');
    
  } catch (error) {
    handleError(error, '자동 배포 프로세스');
  }
}

// 배포 완료 대기 함수 (선택적)
async function waitForDeployment() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      log('⏳ GitHub Actions 실행 중...', 'yellow');
    }, 30000); // 30초마다 상태 출력
    
    // 사용자가 Ctrl+C로 중단할 수 있도록
    process.on('SIGINT', () => {
      clearInterval(interval);
      log('🛑 사용자에 의해 중단됨', 'yellow');
      resolve();
    });
    
    // 10분 후 자동 종료
    setTimeout(() => {
      clearInterval(interval);
      log('⏰ 자동 대기 시간 종료', 'yellow');
      resolve();
    }, 600000);
  });
}

// 스마트 배포 함수 (변경사항 분석 및 최적화)
function smartDeploy() {
  log('🧠 스마트 배포 모드 시작!', 'magenta');
  
  try {
    // 변경사항 분석
    const changes = execSync('git status --porcelain', { encoding: 'utf8' });
    const files = changes.trim().split('\n').filter(line => line.trim());
    
    if (files.length === 0) {
      log('✅ 변경사항이 없습니다', 'green');
      return;
    }
    
    // 파일 타입별 분석
    const analysis = {
      components: files.filter(f => f.includes('src/components/')),
      pages: files.filter(f => f.includes('src/app/')),
      styles: files.filter(f => f.includes('.css') || f.includes('.scss')),
      config: files.filter(f => f.includes('package.json') || f.includes('next.config.js')),
      docs: files.filter(f => f.includes('docs/') || f.includes('README')),
      scripts: files.filter(f => f.includes('scripts/') || f.includes('.github/'))
    };
    
    log('📊 변경사항 분석 결과:', 'cyan');
    Object.entries(analysis).forEach(([type, files]) => {
      if (files.length > 0) {
        log(`  ${type}: ${files.length}개 파일`, 'yellow');
      }
    });
    
    // 스마트 커밋 메시지 생성
    const smartMessage = generateSmartCommitMessage(analysis);
    
    // 자동 배포 실행
    executeSmartDeploy(smartMessage);
    
  } catch (error) {
    handleError(error, '스마트 배포');
  }
}

// 스마트 커밋 메시지 생성
function generateSmartCommitMessage(analysis) {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('ko-KR', { 
    hour12: false, 
    timeZone: 'Asia/Seoul' 
  });
  
  let message = `🚀 스마트 배포 - ${timestamp} ${time}`;
  
  // 변경사항에 따른 메시지 추가
  if (analysis.components.length > 0) {
    message += `\n🔧 컴포넌트 업데이트 (${analysis.components.length}개)`;
  }
  if (analysis.pages.length > 0) {
    message += `\n📄 페이지 업데이트 (${analysis.pages.length}개)`;
  }
  if (analysis.styles.length > 0) {
    message += `\n🎨 스타일 업데이트 (${analysis.styles.length}개)`;
  }
  if (analysis.config.length > 0) {
    message += `\n⚙️ 설정 업데이트 (${analysis.config.length}개)`;
  }
  
  return message;
}

// 스마트 배포 실행
function executeSmartDeploy(commitMessage) {
  log('🚀 스마트 배포 실행 중...', 'magenta');
  
  try {
    // 변경사항 스테이징
    executeCommand('git add .', '스마트 스테이징');
    
    // 스마트 커밋
    executeCommand(`git commit -m "${commitMessage}"`, '스마트 커밋');
    
    // GitHub 푸시
    executeCommand('git push origin main', '스마트 푸시');
    
    log('🎉 스마트 배포 완료!', 'bright');
    
  } catch (error) {
    handleError(error, '스마트 배포 실행');
  }
}

// 메인 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--smart')) {
    smartDeploy();
  } else if (args.includes('--wait')) {
    autoDeploy().catch(handleError);
  } else {
    autoDeploy().catch(handleError);
  }
}

module.exports = { 
  autoDeploy, 
  smartDeploy,
  executeCommand, 
  checkGitStatus,
  generateSmartCommitMessage 
};
