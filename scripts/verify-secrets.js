#!/usr/bin/env node

/**
 * GitHub Secrets 설정 검증 스크립트
 * 30년 경력 풀스택 프로그래머, 웹디자이너, 심리상담전문가 협업 검토
 */

console.log('🔍 GitHub Secrets 설정 검증 스크립트');
console.log('==================================\n');

// 1. 필수 GitHub Secrets 목록
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

// 2. 검증 규칙
const validationRules = {
  'FIREBASE_TOKEN': {
    pattern: /^1\/\/[A-Za-z0-9_-]+$/,
    description: 'Firebase CI 토큰 형식 (1//로 시작)'
  },
  'FIREBASE_SERVICE_ACCOUNT': {
    pattern: /^{[\s\S]*"type":\s*"service_account"[\s\S]*}$/,
    description: '유효한 JSON 형태의 서비스 계정 키'
  },
  'NEXT_PUBLIC_FIREBASE_API_KEY': {
    pattern: /^AIza[A-Za-z0-9_-]{35}$/,
    description: 'Firebase API Key 형식 (AIza로 시작, 39자)'
  },
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': {
    pattern: /^wiz-coco\.firebaseapp\.com$/,
    description: '올바른 Auth Domain (wiz-coco.firebaseapp.com)'
  },
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': {
    pattern: /^wiz-coco$/,
    description: '올바른 Project ID (wiz-coco)'
  },
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': {
    pattern: /^wiz-coco\.appspot\.com$/,
    description: '올바른 Storage Bucket (wiz-coco.appspot.com)'
  },
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': {
    pattern: /^\d+$/,
    description: '숫자만으로 구성된 Messaging Sender ID'
  },
  'NEXT_PUBLIC_FIREBASE_APP_ID': {
    pattern: /^1:\d+:web:[A-Za-z0-9_-]+$/,
    description: 'App ID 형식 (1:숫자:web:문자열)'
  },
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': {
    pattern: /^G-[A-Z0-9]+$/,
    description: 'Measurement ID 형식 (G-로 시작)'
  }
};

// 3. 검증 함수
function validateSecret(name, value) {
  const rule = validationRules[name];
  if (!rule) {
    return { valid: true, message: '검증 규칙 없음' };
  }
  
  const isValid = rule.pattern.test(value);
  return {
    valid: isValid,
    message: isValid ? '✅ 유효함' : `❌ ${rule.description}`
  };
}

// 4. 검증 결과 출력
console.log('📋 GitHub Secrets 설정 검증 가이드');
console.log('================================\n');

console.log('🔗 GitHub Secrets 설정 페이지:');
console.log('https://github.com/jomigata/wizcoco_2025/settings/secrets/actions\n');

console.log('📝 필수 Secrets 검증 목록:\n');

requiredSecrets.forEach((secretName, index) => {
  const rule = validationRules[secretName];
  console.log(`${index + 1}. ${secretName}`);
  console.log(`   설명: ${rule ? rule.description : '검증 규칙 없음'}`);
  console.log(`   상태: ⚠️ 설정 필요`);
  console.log(`   검증: ${rule ? rule.pattern.toString() : 'N/A'}\n`);
});

console.log('🚀 설정 완료 후 검증 방법:');
console.log('1. GitHub Secrets 페이지에서 각 Secret 확인');
console.log('2. 위의 검증 규칙에 맞는지 확인');
console.log('3. GitHub Actions 재실행');
console.log('4. 배포 성공 확인\n');

console.log('🌐 관련 링크:');
console.log('- GitHub Actions: https://github.com/jomigata/wizcoco_2025/actions');
console.log('- Firebase Console: https://console.firebase.google.com/project/wiz-coco/settings/general');
console.log('- 배포 확인: https://wiz-coco.web.app\n');

console.log('✅ 모든 Secrets가 올바르게 설정되면 자동 배포가 성공합니다!'); 