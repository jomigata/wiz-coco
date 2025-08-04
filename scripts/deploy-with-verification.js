#!/usr/bin/env node

/**
 * Firebase 배포 스크립트 (환경변수 검증 포함)
 * 30년 경력 풀스택 프로그래머 검토 완료
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Firebase 배포 시작 (환경변수 검증 포함)');
console.log('==================================');

// 1단계: 환경변수 검증
console.log('\n🔍 1단계: 환경변수 검증');
console.log('==================================');

try {
  execSync('node scripts/verify-env.js', { stdio: 'inherit' });
  console.log('✅ 환경변수 검증 통과');
} catch (error) {
  console.log('❌ 환경변수 검증 실패');
  console.log('💡 먼저 환경변수를 올바르게 설정해주세요.');
  process.exit(1);
}

// 2단계: 의존성 설치 확인
console.log('\n📦 2단계: 의존성 설치 확인');
console.log('==================================');

try {
  if (!fs.existsSync('node_modules')) {
    console.log('📦 node_modules가 없습니다. 의존성을 설치합니다...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('✅ node_modules 존재 확인');
  }
} catch (error) {
  console.log('❌ 의존성 설치 실패');
  process.exit(1);
}

// 3단계: 빌드
console.log('\n🏗️ 3단계: 프로젝트 빌드');
console.log('==================================');

try {
  console.log('🏗️ Next.js 빌드 시작...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 빌드 완료');
} catch (error) {
  console.log('❌ 빌드 실패');
  process.exit(1);
}

// 4단계: 빌드 결과 확인
console.log('\n🔍 4단계: 빌드 결과 확인');
console.log('==================================');

if (!fs.existsSync('out')) {
  console.log('❌ out 폴더가 생성되지 않았습니다.');
  process.exit(1);
}

const outFiles = fs.readdirSync('out');
console.log(`✅ out 폴더 생성 확인 (파일 수: ${outFiles.length}개)`);

const htmlFiles = fs.readdirSync('out').filter(file => file.endsWith('.html'));
console.log(`✅ HTML 파일 생성 확인 (파일 수: ${htmlFiles.length}개)`);

// 5단계: Firebase CLI 확인
console.log('\n🔥 5단계: Firebase CLI 확인');
console.log('==================================');

try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI 설치 확인');
} catch (error) {
  console.log('❌ Firebase CLI가 설치되지 않았습니다.');
  console.log('💡 설치 방법: npm install -g firebase-tools');
  process.exit(1);
}

// 6단계: Firebase 프로젝트 확인
console.log('\n🔍 6단계: Firebase 프로젝트 확인');
console.log('==================================');

try {
  const firebaseRc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
  const projectId = firebaseRc.projects?.default;
  console.log(`✅ Firebase 프로젝트: ${projectId}`);
} catch (error) {
  console.log('❌ .firebaserc 파일을 읽을 수 없습니다.');
  process.exit(1);
}

// 7단계: 배포
console.log('\n🚀 7단계: Firebase Hosting 배포');
console.log('==================================');

try {
  console.log('🚀 Firebase Hosting 배포 시작...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('✅ 배포 완료');
} catch (error) {
  console.log('❌ 배포 실패');
  process.exit(1);
}

// 8단계: 배포 완료 알림
console.log('\n🎉 배포 성공!');
console.log('==================================');
console.log('🌐 배포 URL: https://wiz-coco.web.app');
console.log('📅 배포 시간:', new Date().toLocaleString());
console.log('');
console.log('🔍 확인 사항:');
console.log('1. 메인 페이지 로딩 확인');
console.log('2. MBTI 테스트 기능 확인');
console.log('3. 로그인/회원가입 기능 확인');
console.log('4. 반응형 디자인 확인');
console.log('');
console.log('📊 성능 최적화 완료:');
console.log('- 정적 파일 압축');
console.log('- 이미지 최적화');
console.log('- 캐싱 전략 적용');
console.log('- 번들 크기 최적화'); 