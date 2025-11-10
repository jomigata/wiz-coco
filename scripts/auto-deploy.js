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
const https = require('https');
const http = require('http');

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

// 명령어 실행 함수 (완전 자동화)
function executeCommand(command, description, options = {}) {
  log(`🔄 ${description} 실행 중...`, 'blue');
  log(`📝 명령어: ${command}`, 'cyan');
  
  try {
    // UTF-8 인코딩 환경 변수 설정
    const env = {
      ...process.env,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      PYTHONIOENCODING: 'utf-8'
    };
    
    // Git 명령어에 대한 특별한 처리
    const gitOptions = {
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 30000, // 30초 타임아웃
      maxBuffer: 1024 * 1024, // 1MB 버퍼
      env: env,
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
      ...options
    };
    
    // Git 명령어별 최적화된 옵션
    if (command.includes('git add')) {
      gitOptions.stdio = ['pipe', 'pipe', 'pipe'];
      gitOptions.timeout = 60000; // git add는 더 긴 타임아웃
    } else if (command.includes('git commit')) {
      gitOptions.stdio = ['pipe', 'pipe', 'pipe'];
      gitOptions.timeout = 45000; // git commit 타임아웃
    } else if (command.includes('git push')) {
      gitOptions.stdio = ['pipe', 'pipe', 'pipe'];
      gitOptions.timeout = 120000; // git push는 가장 긴 타임아웃
    }
    
    let result = execSync(command, gitOptions);
    
    // 결과가 Buffer인 경우 UTF-8로 디코딩
    if (Buffer.isBuffer(result)) {
      result = result.toString('utf8');
    }
    
    log(`✅ ${description} 완료`, 'green');
    if (result && result.trim()) {
      log(`📊 결과: ${result.trim()}`, 'cyan');
    }
    return result;
  } catch (error) {
    // Git 명령어별 구체적인 오류 처리
    if (command.includes('git add') && error.message.includes('timeout')) {
      log(`⚠️ ${description} 타임아웃, 재시도 중...`, 'yellow');
      return retryGitCommand(command, description, options);
    } else if (command.includes('git push') && error.message.includes('timeout')) {
      log(`⚠️ ${description} 타임아웃, 재시도 중...`, 'yellow');
      return retryGitCommand(command, description, options);
    }
    
    handleError(error, description);
  }
}

// Git 명령어 재시도 함수
function retryGitCommand(command, description, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`🔄 ${description} 재시도 ${attempt}/${maxRetries}...`, 'yellow');
      
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000,
        maxBuffer: 1024 * 1024,
        ...options
      });
      
      log(`✅ ${description} 재시도 성공!`, 'green');
      return result;
    } catch (retryError) {
      if (attempt === maxRetries) {
        handleError(retryError, `${description} 최종 재시도 실패`);
      }
      log(`⚠️ ${description} 재시도 ${attempt} 실패, 잠시 대기 후 재시도...`, 'yellow');
      // 재시도 간 잠시 대기
      setTimeout(() => {}, 2000);
    }
  }
}

// Git 상태 확인 함수 (최적화)
function checkGitStatus() {
  log('🔍 Git 상태 확인 중...', 'blue');
  
  try {
    // Git 상태 확인을 위한 최적화된 옵션
    const status = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 15000, // 15초 타임아웃
      cwd: process.cwd()
    });
    
    if (!status.trim()) {
      log('✅ Git 작업 디렉토리가 깨끗합니다', 'green');
      return false; // 변경사항 없음
    }
    
    log('📝 변경사항 발견:', 'yellow');
    log(status, 'cyan');
    return true; // 변경사항 있음
  } catch (error) {
    log('⚠️ Git 상태 확인 실패, 계속 진행합니다', 'yellow');
    log(`🔍 오류 상세: ${error.message}`, 'yellow');
    return true; // 안전하게 변경사항이 있다고 가정
  }
}

// 자동 커밋 메시지 생성 함수
function generateCommitMessage() {
  const now = new Date();
  const timestamp = now.toISOString().split('T')[0];
  
  // 한국 시간으로 변환 (UTC+9) - 영문으로 표시하여 인코딩 문제 완전 차단
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  const hours = String(koreaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(koreaTime.getUTCSeconds()).padStart(2, '0');
  const time = `${hours}:${minutes}:${seconds}`;
  
  // 변경사항 분석하여 주요 변경사항 추출
  try {
    const changes = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10000
    });
    
    const files = changes.trim().split('\n').filter(line => line.trim());
    const analysis = {
      components: files.filter(f => f.includes('src/components/')),
      pages: files.filter(f => f.includes('src/app/')),
      styles: files.filter(f => f.includes('.css') || f.includes('.scss')),
      config: files.filter(f => f.includes('package.json') || f.includes('next.config.js')),
      scripts: files.filter(f => f.includes('scripts/') || f.includes('.github/')),
      docs: files.filter(f => f.includes('docs/') || f.includes('README'))
    };
    
    // 주요 변경사항 식별 (영문으로 변경하여 인코딩 문제 완전 차단)
    let mainChange = '';
    if (analysis.components.length > 0) {
      mainChange = 'UI Component Update';
    } else if (analysis.pages.length > 0) {
      mainChange = 'Page Feature Update';
    } else if (analysis.styles.length > 0) {
      mainChange = 'Style Improvement';
    } else if (analysis.config.length > 0) {
      mainChange = 'Config Optimization';
    } else if (analysis.scripts.length > 0) {
      mainChange = 'Deploy System Update';
    } else if (analysis.docs.length > 0) {
      mainChange = 'Documentation Update';
    } else {
      mainChange = 'Code Optimization';
    }
    
    // Always ASCII/English to avoid mojibake in GitHub UI/logs
    return `${mainChange} - ${timestamp} ${time} KST`;
  } catch (error) {
    // 오류 발생 시 기본 메시지 사용
    return `Code Update - ${timestamp} ${time}`;
  }
}

// 완전 자동화된 배포 프로세스 (강화)
async function autoDeploy() {
  log('🚀 WizCoCo 완전 자동화 배포 시작!', 'bright');
  log('=====================================', 'blue');
  
  try {
    // 1단계: Git 상태 확인 (강화된 오류 처리)
    log('📋 1단계: Git 상태 확인', 'cyan');
    const hasChanges = checkGitStatus();
    
    if (!hasChanges) {
      log('ℹ️ 변경사항이 없어 배포를 건너뜁니다', 'yellow');
      return;
    }
    
    // 2단계: 모든 변경사항 스테이징 (강화된 자동화)
    log('📋 2단계: 변경사항 스테이징', 'cyan');
    log('📦 변경사항 스테이징 중...', 'blue');
    
    // git add 명령어 실행 전 상태 확인
    const beforeAdd = execSync('git status --porcelain', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 10000 
    });
    log(`📊 스테이징 전 변경사항: ${beforeAdd.trim().split('\n').length}개 파일`, 'cyan');
    
    executeCommand('git add .', 'Git 스테이징');
    
    // 스테이징 후 상태 확인
    const afterAdd = execSync('git status --porcelain', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 10000 
    });
    log(`📊 스테이징 후 상태: ${afterAdd.trim().split('\n').length}개 파일 스테이징됨`, 'cyan');
    
    // 3단계: 자동 커밋 (강화된 자동화)
    log('📋 3단계: 자동 커밋', 'cyan');
    const commitMessage = generateCommitMessage();
    log('💾 자동 커밋 생성 중...', 'blue');
    log(`📝 커밋 메시지: ${commitMessage}`, 'cyan');
    
    executeCommand(`git commit -m "${commitMessage}"`, '자동 커밋');
    
    // 커밋 후 상태 확인
    const commitHash = execSync('git rev-parse HEAD', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 10000 
    });
    log(`✅ 커밋 완료: ${commitHash.trim().substring(0, 8)}`, 'green');
    
    // 4단계: GitHub 푸시 (강화된 자동화)
    log('📋 4단계: GitHub 푸시', 'cyan');
    log('🚀 GitHub 푸시 중...', 'blue');
    
    executeCommand('git push origin main', 'GitHub 푸시');
    
    // 푸시 후 원격 상태 확인
    const remoteStatus = execSync('git status -uno', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 15000 
    });
    log('📊 푸시 후 원격 상태 확인 완료', 'green');
    
    // 5단계: 배포 상태 확인 (강화)
    log('📋 5단계: 배포 상태 확인', 'cyan');
    log('🔍 배포 상태 확인 중...', 'blue');
    log('📊 GitHub Actions가 자동으로 실행됩니다', 'green');
    
    // 커밋 해시로 최신 워크플로우 실행 링크 생성
    const commitHashFull = commitHash.trim();
    const commitHashShort = commitHashFull.substring(0, 8);
    const actionsUrl = 'https://github.com/jomigata/wiz-coco/actions';
    const latestRunUrl = `https://github.com/jomigata/wiz-coco/actions/runs?query=sha%3A${commitHashFull}`;
    
    log('🌐 Actions 페이지:', 'cyan');
    log(`   전체 Actions: ${actionsUrl}`, 'cyan');
    log(`   최신 실행: ${latestRunUrl}`, 'cyan');
    log('', 'reset');
    
    // 자동 상태 모니터링 시작 (기본적으로 활성화)
    const shouldMonitor = !process.argv.includes('--no-monitor');
    if (shouldMonitor) {
      log('🔄 GitHub Actions 상태 자동 모니터링 시작...', 'yellow');
      log('💡 터미널에서 실시간으로 Actions 상태를 확인할 수 있습니다', 'yellow');
      log('   (--no-monitor 옵션으로 자동 모니터링을 비활성화할 수 있습니다)', 'yellow');
      log('', 'reset');
      
      // 백그라운드에서 상태 모니터링 시작 (비동기)
      monitorActionsStatus(commitHashFull).catch(err => {
        log(`⚠️ Actions 상태 모니터링 오류: ${err.message}`, 'yellow');
      });
    } else {
      log('💡 Actions 상태 확인 방법:', 'yellow');
      log('   1. 위의 Actions 페이지 링크를 클릭하세요', 'yellow');
      log('   2. 브라우저에서 F5 키 또는 새로고침 버튼을 눌러 최신 상태를 확인하세요', 'yellow');
      log('   3. 최신 실행 링크에서 해당 커밋의 워크플로우 실행 상태를 바로 확인할 수 있습니다', 'yellow');
      log('', 'reset');
    }
    
    // 6단계: 배포 완료 대기 (선택적)
    if (process.argv.includes('--wait')) {
      log('⏳ 배포 완료 대기 중... (Ctrl+C로 중단 가능)', 'yellow');
      await waitForDeployment(commitHashFull);
    }
    
    log('🎉 완전 자동화 배포 완료!', 'bright');
    log('=====================================', 'green');
    
  } catch (error) {
    log('❌ 자동 배포 프로세스 중 오류 발생', 'red');
    log(`🔍 오류 상세: ${error.message}`, 'red');
    
    // 오류 발생 시 복구 시도
    try {
      log('🔄 자동 복구 시도 중...', 'yellow');
      await attemptRecovery();
    } catch (recoveryError) {
      log('❌ 자동 복구 실패', 'red');
      handleError(error, '자동 배포 프로세스');
    }
  }
}

// 자동 복구 함수
async function attemptRecovery() {
  log('🔧 자동 복구 프로세스 시작...', 'yellow');
  
  try {
    // Git 상태 재확인
    const status = execSync('git status --porcelain', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 15000 
    });
    
    if (status.trim()) {
      log('📝 변경사항이 여전히 존재합니다', 'cyan');
      
      // 강제로 스테이징 시도
      try {
        execSync('git add .', { 
          stdio: 'pipe', 
          timeout: 60000,
          cwd: process.cwd()
        });
        log('✅ 강제 스테이징 성공', 'green');
        
        // 강제 커밋 시도
        const commitMessage = `Recovery Commit - ${new Date().toISOString()}`;
        execSync(`git commit -m "${commitMessage}"`, { 
          stdio: 'pipe',
          encoding: 'utf8', 
          timeout: 45000,
          cwd: process.cwd(),
          shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
        });
        log('✅ 강제 커밋 성공', 'green');
        
        // 강제 푸시 시도
        execSync('git push origin main', { 
          stdio: 'pipe', 
          timeout: 120000,
          cwd: process.cwd()
        });
        log('✅ 강제 푸시 성공', 'green');
        
        log('🎉 자동 복구 완료!', 'bright');
        return;
      } catch (forceError) {
        log(`❌ 강제 복구 실패: ${forceError.message}`, 'red');
        throw forceError;
      }
    } else {
      log('✅ Git 상태가 정상입니다', 'green');
    }
  } catch (recoveryError) {
    log(`❌ 복구 프로세스 실패: ${recoveryError.message}`, 'red');
    throw recoveryError;
  }
}

// GitHub Actions 상태 모니터링 함수 (자동)
async function monitorActionsStatus(commitHash) {
  const maxChecks = 40; // 최대 20분 (30초 * 40)
  let checkCount = 0;
  let lastStatus = null;
  
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      checkCount++;
      
      try {
        // GitHub Actions API를 통해 워크플로우 실행 상태 확인
        const status = await checkWorkflowStatus(commitHash);
        
        if (status) {
          const statusEmoji = status.conclusion === 'success' ? '✅' : 
                             status.conclusion === 'failure' ? '❌' : 
                             status.status === 'in_progress' ? '🔄' : '⏳';
          const statusText = status.conclusion === 'success' ? '성공' : 
                            status.conclusion === 'failure' ? '실패' : 
                            status.status === 'in_progress' ? '진행 중' : '대기 중';
          
          // 상태가 변경되었을 때만 출력
          if (lastStatus !== status.status + status.conclusion) {
            log(`📊 Actions 상태: ${statusEmoji} ${statusText}`, 
                status.conclusion === 'success' ? 'green' : 
                status.conclusion === 'failure' ? 'red' : 'yellow');
            
            if (status.runUrl) {
              log(`   실행 링크: ${status.runUrl}`, 'cyan');
            }
            
            if (status.conclusion === 'success') {
              log('🎉 배포가 성공적으로 완료되었습니다!', 'bright');
              clearInterval(interval);
              resolve();
              return;
            } else if (status.conclusion === 'failure') {
              log('❌ 배포가 실패했습니다. Actions 페이지에서 로그를 확인하세요.', 'red');
              clearInterval(interval);
              resolve();
              return;
            }
            
            lastStatus = status.status + (status.conclusion || '');
          }
        }
      } catch (error) {
        // API 호출 실패는 조용히 무시 (네트워크 문제 등)
        if (checkCount % 4 === 0) { // 2분마다 한 번만 경고
          log(`⚠️ Actions 상태 확인 중 오류 (재시도 중...): ${error.message}`, 'yellow');
        }
      }
      
      if (checkCount >= maxChecks) {
        clearInterval(interval);
        log('⏰ 자동 모니터링 시간 종료', 'yellow');
        log('🌐 Actions 페이지에서 수동으로 확인하세요:', 'cyan');
        log(`   https://github.com/jomigata/wiz-coco/actions/runs?query=sha%3A${commitHash}`, 'cyan');
        resolve();
      }
    }, 30000); // 30초마다 상태 확인
  });
}

// GitHub Actions 워크플로우 상태 확인 함수
function checkWorkflowStatus(commitHash) {
  return new Promise((resolve, reject) => {
    const owner = 'jomigata';
    const repo = 'wiz-coco';
    
    // GitHub API 엔드포인트 (공개 저장소는 인증 없이도 가능)
    const apiUrl = `/repos/${owner}/${repo}/actions/runs?head_sha=${commitHash}&per_page=1`;
    
    const options = {
      hostname: 'api.github.com',
      path: apiUrl,
      method: 'GET',
      headers: {
        'User-Agent': 'WizCoCo-Deploy-Script',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.workflow_runs && response.workflow_runs.length > 0) {
              const run = response.workflow_runs[0];
              resolve({
                status: run.status,
                conclusion: run.conclusion,
                runUrl: run.html_url,
                createdAt: run.created_at,
                updatedAt: run.updated_at
              });
            } else {
              resolve(null); // 아직 워크플로우가 시작되지 않음
            }
          } else if (res.statusCode === 403) {
            // API rate limit 또는 인증 필요
            reject(new Error('API rate limit 또는 인증이 필요합니다'));
          } else {
            reject(new Error(`API 호출 실패: ${res.statusCode}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('API 호출 타임아웃'));
    });
    
    req.end();
  });
}

// 배포 완료 대기 함수 (선택적)
async function waitForDeployment(commitHash) {
  if (!commitHash) {
    commitHash = execSync('git rev-parse HEAD', { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 10000 
    }).trim();
  }
  
  const latestRunUrl = `https://github.com/jomigata/wiz-coco/actions/runs?query=sha%3A${commitHash}`;
  
  log('⏳ GitHub Actions 실행 상태 모니터링 시작...', 'yellow');
  log(`🌐 최신 실행 확인: ${latestRunUrl}`, 'cyan');
  log('💡 터미널에서 실시간으로 Actions 상태를 확인할 수 있습니다', 'yellow');
  log('', 'reset');
  
  // 자동 상태 모니터링 시작
  await monitorActionsStatus(commitHash);
}

// 스마트 배포 함수 (강화된 변경사항 분석 및 최적화)
function smartDeploy() {
  log('🧠 스마트 배포 모드 시작!', 'magenta');
  
  try {
    // 변경사항 분석 (강화된 오류 처리)
    log('🔍 변경사항 분석 중...', 'blue');
    const changes = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 15000
    });
    const files = changes.trim().split('\n').filter(line => line.trim());
    
    if (files.length === 0) {
      log('✅ 변경사항이 없습니다', 'green');
      return;
    }
    
    log(`📝 총 ${files.length}개 파일의 변경사항 발견`, 'cyan');
    
    // 파일 타입별 상세 분석
    const analysis = {
      components: files.filter(f => f.includes('src/components/')),
      pages: files.filter(f => f.includes('src/app/')),
      styles: files.filter(f => f.includes('.css') || f.includes('.scss')),
      config: files.filter(f => f.includes('package.json') || f.includes('next.config.js')),
      docs: files.filter(f => f.includes('docs/') || f.includes('README')),
      scripts: files.filter(f => f.includes('scripts/') || f.includes('.github/')),
      other: files.filter(f => !f.includes('src/') && !f.includes('docs/') && !f.includes('scripts/'))
    };
    
    log('📊 변경사항 상세 분석 결과:', 'cyan');
    Object.entries(analysis).forEach(([type, files]) => {
      if (files.length > 0) {
        log(`  ${type}: ${files.length}개 파일`, 'yellow');
        // 중요 파일들 상세 표시
        if (files.length <= 5) {
          files.forEach(file => {
            const status = file.substring(0, 2);
            const fileName = file.substring(3);
            log(`    ${status} ${fileName}`, 'cyan');
          });
        }
      }
    });
    
    // 스마트 커밋 메시지 생성
    const smartMessage = generateSmartCommitMessage(analysis);
    log(`📝 생성된 커밋 메시지: ${smartMessage}`, 'magenta');
    
    // 자동 배포 실행
    executeSmartDeploy(smartMessage);
    
  } catch (error) {
    log('❌ 스마트 배포 분석 실패', 'red');
    log(`🔍 오류 상세: ${error.message}`, 'red');
    
    // 분석 실패 시에도 기본 배포 시도
    log('🔄 기본 배포 모드로 전환...', 'yellow');
    autoDeploy().catch(handleError);
  }
}

// 스마트 커밋 메시지 생성
function generateSmartCommitMessage(analysis) {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    timeZone: 'Asia/Seoul' 
  });
  
  // English-only commit message to prevent encoding issues
  let message = `Smart Deploy - ${timestamp} ${time} KST`;
  
  // 변경사항에 따른 메시지 추가
  if (analysis.components.length > 0) {
    message += `\nComponents updated: ${analysis.components.length}`;
  }
  if (analysis.pages.length > 0) {
    message += `\nPages updated: ${analysis.pages.length}`;
  }
  if (analysis.styles.length > 0) {
    message += `\nStyles updated: ${analysis.styles.length}`;
  }
  if (analysis.config.length > 0) {
    message += `\nConfigs updated: ${analysis.config.length}`;
  }
  
  return message;
}

// 스마트 배포 실행
function executeSmartDeploy(commitMessage) {
  log('🚀 스마트 배포 실행 중...', 'magenta');
  
  try {
    // 변경사항 스테이징
    executeCommand('git add .', 'Smart staging');
    
    // 스마트 커밋
    executeCommand(`git commit -m "${commitMessage}"`, 'Smart commit');
    
    // GitHub 푸시
    executeCommand('git push origin main', 'Smart push');
    
    log('🎉 스마트 배포 완료!', 'bright');
    
  } catch (error) {
    handleError(error, '스마트 배포 실행');
  }
}

// 고속 배포 함수 (git add 문제 해결)
function fastDeploy() {
  log('⚡ 고속 배포 모드 시작!', 'magenta');
  log('🚀 Git 명령어 지연 문제를 우회합니다', 'cyan');
  
  try {
    // 1단계: 빠른 Git 상태 확인
    log('📋 1단계: 빠른 Git 상태 확인', 'cyan');
    const status = execSync('git status --porcelain', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10000
    });
    
    if (!status.trim()) {
      log('✅ 변경사항이 없습니다', 'green');
      return;
    }
    
    const fileCount = status.trim().split('\n').length;
    log(`📝 ${fileCount}개 파일의 변경사항 발견`, 'yellow');
    
    // 2단계: 강제 스테이징 (타임아웃 없음)
    log('📋 2단계: 강제 스테이징', 'cyan');
    log('📦 변경사항 강제 스테이징 중...', 'blue');
    
    try {
      execSync('git add .', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      log('✅ 강제 스테이징 성공!', 'green');
    } catch (addError) {
      log(`⚠️ git add 실패, 대안 방법 시도: ${addError.message}`, 'yellow');
      
      // 대안: 개별 파일 스테이징
      const files = status.trim().split('\n').map(line => line.substring(3));
      log(`🔄 ${files.length}개 파일을 개별적으로 스테이징...`, 'cyan');
      
      files.forEach(file => {
        try {
          execSync(`git add "${file}"`, { 
            stdio: 'pipe',
            cwd: process.cwd()
          });
          log(`✅ ${file} 스테이징 성공`, 'green');
        } catch (fileError) {
          log(`⚠️ ${file} 스테이징 실패: ${fileError.message}`, 'yellow');
        }
      });
    }
    
    // 3단계: 빠른 커밋
    log('📋 3단계: 빠른 커밋', 'cyan');
  const commitMessage = `Fast Deploy - ${new Date().toISOString()}`;
    log('💾 빠른 커밋 생성 중...', 'blue');
    
    execSync(`git commit -m "${commitMessage}"`, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd(),
      shell: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'
    });
    log('✅ 빠른 커밋 성공!', 'green');
    
    // 4단계: 강제 푸시
    log('📋 4단계: 강제 푸시', 'cyan');
    log('🚀 GitHub 강제 푸시 중...', 'blue');
    
    execSync('git push origin main', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log('✅ 강제 푸시 성공!', 'green');
    
    log('🎉 고속 배포 완료!', 'bright');
    log('📊 GitHub Actions가 자동으로 실행됩니다', 'cyan');
    
  } catch (error) {
    log('❌ 고속 배포 실패', 'red');
    log(`🔍 오류 상세: ${error.message}`, 'red');
    
    // 고속 배포 실패 시 기본 배포 시도
    log('🔄 기본 배포 모드로 전환...', 'yellow');
    autoDeploy().catch(handleError);
  }
}

// 메인 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--fast')) {
    fastDeploy();
  } else if (args.includes('--smart')) {
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
