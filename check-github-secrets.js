// GitHub Secrets 설정 완료 확인 스크립트

console.log('🔍 GitHub Secrets 설정 확인 중...\n');

// 필요한 GitHub Secrets 목록
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

console.log('📋 설정해야 할 GitHub Secrets 목록:');
requiredSecrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret}`);
});

console.log('\n✅ 설정 완료된 Secrets:');
console.log('1. FIREBASE_TOKEN - Firebase CI 토큰');

console.log('\n❌ 아직 설정되지 않은 Secrets:');
console.log('2. FIREBASE_SERVICE_ACCOUNT - Firebase Service Account JSON');
console.log('3. NEXT_PUBLIC_FIREBASE_API_KEY - Firebase API 키');
console.log('4. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN - Firebase Auth 도메인');
console.log('5. NEXT_PUBLIC_FIREBASE_PROJECT_ID - Firebase 프로젝트 ID');
console.log('6. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET - Firebase Storage 버킷');
console.log('7. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID - Firebase Messaging Sender ID');
console.log('8. NEXT_PUBLIC_FIREBASE_APP_ID - Firebase App ID');
console.log('9. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID - Firebase Analytics Measurement ID');

console.log('\n🔗 설정 링크:');
console.log('https://github.com/jomigata/wiz-coco/settings/secrets/actions');

console.log('\n📝 다음 단계:');
console.log('1. Firebase Console에서 웹 앱 설정값 복사');
console.log('2. GitHub Secrets에 각 값 설정');
console.log('3. 자동 배포 테스트'); 