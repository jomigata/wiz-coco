// 간단한 Firebase 토큰 검증 스크립트
// Node.js가 설치되어 있지 않아도 실행 가능

const token = "1//0gAPQL2pA35NPCgYIARAAGBASNwF-L9IrfFhKm0PxCSgF8CUhBnddPfW-KFndg5s5l6YUBo3WpzamLHg-1pRL269_ExnDhYIxHfg";

console.log('🔍 Firebase 토큰 확인 중...');
console.log('토큰:', token.substring(0, 20) + '...');

// 토큰 형식 확인
if (token.startsWith('1//')) {
  console.log('✅ 토큰 형식이 올바릅니다 (Firebase CI 토큰)');
} else {
  console.log('❌ 토큰 형식이 올바르지 않습니다');
}

// 토큰 길이 확인
if (token.length > 100) {
  console.log('✅ 토큰 길이가 적절합니다');
} else {
  console.log('❌ 토큰 길이가 너무 짧습니다');
}

console.log('\n📝 이 토큰을 GitHub Secrets에 설정하세요:');
console.log('Name: FIREBASE_TOKEN');
console.log('Value:', token);

console.log('\n🔗 설정 링크:');
console.log('https://github.com/jomigata/wiz-coco/settings/secrets/actions'); 