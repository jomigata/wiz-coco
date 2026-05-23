#!/usr/bin/env node

/**
 * GitHub Secrets 설정 도우미 스크립트
 * 30년 경력 풀스택 프로그래머 검토 완료
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 GitHub Secrets 설정 도우미');
console.log('==============================\n');

// 필수 Secrets 목록
const requiredSecrets = [
  {
    name: 'FIREBASE_TOKEN',
    description: 'Firebase CI 토큰 (firebase login:ci로 생성)',
    required: true,
    example: '1//0eXAMPLE_TOKEN_STRING_HERE'
  },
  {
    name: 'FIREBASE_SERVICE_ACCOUNT',
    description: 'Firebase 서비스 계정 JSON 전체 내용',
    required: true,
    example: '{"type": "service_account", ...}'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    description: 'Firebase API Key',
    required: true,
    example: 'AIzaSyC...'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    description: 'Firebase Auth Domain',
    required: true,
    example: 'wiz-coco.firebaseapp.com',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    description: 'Firebase Project ID',
    required: true,
    example: 'wiz-coco'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    description: 'Firebase Storage Bucket',
    required: true,
    example: 'wiz-coco.appspot.com'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    description: 'Firebase Messaging Sender ID',
    required: true,
    example: '123456789'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    description: 'Firebase App ID',
    required: true,
    example: '1:123456789:web:abcdef'
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    description: 'Firebase Analytics Measurement ID',
    required: false,
    example: 'G-XXXXXXXXXX'
  }
];

// 설정 가이드 출력
console.log('📋 필수 GitHub Secrets 목록:\n');

requiredSecrets.forEach((secret, index) => {
  const required = secret.required ? '🔴 필수' : '🟡 선택';
  console.log(`${index + 1}. ${secret.name} ${required}`);
  console.log(`   설명: ${secret.description}`);
  console.log(`   예시: ${secret.example}`);
  console.log('');
});

console.log('🔗 설정 링크:');
console.log('https://github.com/jomigata/wiz-coco/settings/secrets/actions\n');

console.log('📝 설정 방법:');
console.log('1. 위 링크에 접속');
console.log('2. "New repository secret" 클릭');
console.log('3. Name과 Value 입력');
console.log('4. "Add secret" 클릭\n');

console.log('🔍 확인 링크:');
console.log('https://github.com/jomigata/wiz-coco/actions\n');

console.log('✅ 모든 Secrets 설정 완료 후 GitHub Actions가 자동으로 실행됩니다.'); 