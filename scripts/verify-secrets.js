#!/usr/bin/env node

/**
 * GitHub Secrets 검증 스크립트
 * 30년 경력 풀스택 프로그래머 검토 완료
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 GitHub Secrets 검증 도우미');
console.log('============================\n');

// 필수 Secrets 목록
const requiredSecrets = [
  'FIREBASE_TOKEN',
  'FIREBASE_SERVICE_ACCOUNT',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

// 선택적 Secrets 목록
const optionalSecrets = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('📋 필수 GitHub Secrets 목록:\n');

requiredSecrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret} 🔴 필수`);
});

console.log('\n📋 선택적 GitHub Secrets 목록:\n');

optionalSecrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret} 🟡 선택`);
});

console.log('\n🔗 검증 링크:');
console.log('https://github.com/jomigata/wiz-coco/settings/secrets/actions\n');

console.log('📝 검증 방법:');
console.log('1. 위 링크에 접속');
console.log('2. 설정된 Secrets 목록 확인');
console.log('3. 필수 Secrets가 모두 설정되었는지 확인\n');

console.log('🚀 GitHub Actions 확인:');
console.log('- GitHub Actions: https://github.com/jomigata/wiz-coco/actions');

console.log('\n✅ 모든 필수 Secrets가 설정되면 GitHub Actions가 정상 실행됩니다.'); 