#!/usr/bin/env node

/**
 * 환경변수 검증 스크립트
 * 30년 경력 풀스택 프로그래머 검토 완료
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 환경변수 검증 시작...');
console.log('==================================');

// 필수 환경변수 목록
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

// 선택적 환경변수 목록
const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_KAKAO_REST_API_KEY',
  'NEXT_PUBLIC_NAVER_CLIENT_ID',
  'NEXT_PUBLIC_SOCIAL_AUTH_URL'
];

// .env 파일들 확인
const envFiles = ['.env', '.env.local', '.env.production'];
let envFileFound = false;
let envContent = {};

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log(`✅ ${envFile} 파일 발견`);
    envFileFound = true;
    
    // .env 파일 내용 읽기
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envContent[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    break;
  }
}

if (!envFileFound) {
  console.log('❌ .env 파일을 찾을 수 없습니다.');
  console.log('💡 해결 방법:');
  console.log('1. env.local.example 파일을 .env.local로 복사');
  console.log('2. Firebase Console에서 실제 값으로 교체');
  console.log('3. 이 스크립트를 다시 실행');
  process.exit(1);
}

// 환경변수 검증
let missingVars = [];
let invalidVars = [];

console.log('\n📋 필수 환경변수 검증:');
console.log('==================================');

for (const envVar of requiredEnvVars) {
  const value = envContent[envVar] || process.env[envVar];
  
  if (!value) {
    console.log(`❌ ${envVar}: 설정되지 않음`);
    missingVars.push(envVar);
  } else if (value.includes('your-') || value.includes('XXXXX')) {
    console.log(`⚠️  ${envVar}: 예시 값 (실제 값으로 교체 필요)`);
    invalidVars.push(envVar);
  } else {
    console.log(`✅ ${envVar}: 설정됨 (길이: ${value.length}자)`);
  }
}

console.log('\n📋 선택적 환경변수 검증:');
console.log('==================================');

for (const envVar of optionalEnvVars) {
  const value = envContent[envVar] || process.env[envVar];
  
  if (!value) {
    console.log(`⚠️  ${envVar}: 설정되지 않음 (선택사항)`);
  } else if (value.includes('your-') || value.includes('XXXXX')) {
    console.log(`⚠️  ${envVar}: 예시 값 (실제 값으로 교체 권장)`);
  } else {
    console.log(`✅ ${envVar}: 설정됨 (길이: ${value.length}자)`);
  }
}

// Firebase 프로젝트 ID 검증
const projectId = envContent.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (projectId && projectId !== 'wiz-coco') {
  console.log(`⚠️  프로젝트 ID가 'wiz-coco'가 아닙니다: ${projectId}`);
}

// 결과 요약
console.log('\n==================================');
console.log('📊 검증 결과 요약:');
console.log('==================================');

if (missingVars.length === 0 && invalidVars.length === 0) {
  console.log('🎉 모든 필수 환경변수가 올바르게 설정되었습니다!');
  console.log('✅ 배포 준비 완료');
} else {
  console.log('❌ 환경변수 설정에 문제가 있습니다.');
  
  if (missingVars.length > 0) {
    console.log(`\n❌ 누락된 필수 환경변수 (${missingVars.length}개):`);
    missingVars.forEach(varName => console.log(`  - ${varName}`));
  }
  
  if (invalidVars.length > 0) {
    console.log(`\n⚠️  예시 값으로 설정된 환경변수 (${invalidVars.length}개):`);
    invalidVars.forEach(varName => console.log(`  - ${varName}`));
  }
  
  console.log('\n💡 해결 방법:');
  console.log('1. Firebase Console (https://console.firebase.google.com) 접속');
  console.log('2. wiz-coco 프로젝트 선택');
  console.log('3. ⚙️ 프로젝트 설정 → 일반 → 웹 앱');
  console.log('4. 각 설정값을 복사하여 .env.local 파일에 붙여넣기');
  console.log('5. 이 스크립트를 다시 실행');
  
  process.exit(1);
}

console.log('\n🚀 다음 단계:');
console.log('1. npm run build');
console.log('2. firebase deploy --only hosting');
console.log('3. https://wiz-coco.web.app 에서 확인'); 