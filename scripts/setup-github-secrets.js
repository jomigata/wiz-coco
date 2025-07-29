#!/usr/bin/env node

/**
 * GitHub Secrets 설정 자동화 스크립트
 * 30년 경력 풀스택 프로그래머, 웹디자이너, 심리상담전문가 협업 검토
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 GitHub Secrets 설정 자동화 스크립트');
console.log('=====================================\n');

// 1. Firebase Service Account JSON 파일 읽기
const serviceAccountPath = path.join(__dirname, '../Firebase_GitHub/wiz-coco-firebase-adminsdk-fbsvc-69c4c2375c.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase Service Account JSON 파일을 찾을 수 없습니다.');
  console.error('파일 경로:', serviceAccountPath);
  process.exit(1);
}

const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');

console.log('✅ Firebase Service Account JSON 파일 확인됨');
console.log('📄 파일 크기:', serviceAccountContent.length, 'bytes\n');

// 2. 필요한 GitHub Secrets 목록
const requiredSecrets = [
  {
    name: 'FIREBASE_TOKEN',
    description: 'Firebase CI 토큰 (firebase login:ci로 생성)',
    value: '생성된 토큰을 입력하세요',
    required: true
  },
  {
    name: 'FIREBASE_SERVICE_ACCOUNT',
    description: 'Firebase 서비스 계정 JSON 전체 내용',
    value: serviceAccountContent,
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    description: 'Firebase API Key',
    value: 'Firebase Console에서 복사',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    description: 'Firebase Auth Domain',
    value: 'wiz-coco.firebaseapp.com',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    description: 'Firebase Project ID',
    value: 'wiz-coco',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    description: 'Firebase Storage Bucket',
    value: 'wiz-coco.appspot.com',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    description: 'Firebase Messaging Sender ID',
    value: 'Firebase Console에서 복사',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    description: 'Firebase App ID',
    value: 'Firebase Console에서 복사',
    required: true
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    description: 'Firebase Measurement ID',
    value: 'Firebase Console에서 복사',
    required: true
  }
];

// 3. 설정 가이드 출력
console.log('📋 GitHub Secrets 설정 가이드');
console.log('============================\n');

console.log('🔗 GitHub Secrets 설정 페이지:');
console.log('https://github.com/jomigata/wizcoco_2025/settings/secrets/actions\n');

console.log('📝 설정해야 할 Secrets 목록:\n');

requiredSecrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret.name}`);
  console.log(`   설명: ${secret.description}`);
  console.log(`   값: ${secret.value}`);
  console.log(`   필수: ${secret.required ? '✅' : '❌'}\n`);
});

console.log('🚀 설정 완료 후 GitHub Actions 재실행:');
console.log('https://github.com/jomigata/wizcoco_2025/actions\n');

console.log('🌐 배포 확인 URL:');
console.log('https://wiz-coco.web.app\n');

console.log('✅ 모든 설정이 완료되면 자동 배포가 시작됩니다!'); 