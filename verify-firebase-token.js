const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // 실제 API 키로 교체
  authDomain: "wiz-coco.firebaseapp.com",
  projectId: "wiz-coco",
  storageBucket: "wiz-coco.appspot.com",
  messagingSenderId: "123456789012", // 실제 값으로 교체
  appId: "1:123456789012:web:abcdefghijklmnop" // 실제 값으로 교체
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 토큰 확인
const token = "1//0gAPQL2pA35NPCgYIARAAGBASNwF-L9IrfFhKm0PxCSgF8CUhBnddPfW-KFndg5s5l6YUBo3WpzamLHg-1pRL269_ExnDhYIxHfg";

console.log('🔍 Firebase 토큰 확인 중...');
console.log('토큰:', token.substring(0, 20) + '...');

// 토큰 형식 확인
if (token.startsWith('1//')) {
  console.log('✅ 토큰 형식이 올바릅니다 (Firebase CI 토큰)');
} else {
  console.log('❌ 토큰 형식이 올바르지 않습니다');
}

console.log('\n📝 이 토큰을 GitHub Secrets에 설정하세요:');
console.log('Name: FIREBASE_TOKEN');
console.log('Value:', token); 