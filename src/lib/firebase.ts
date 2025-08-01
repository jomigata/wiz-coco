// [Firebase 연동 안내]
// 1. .env 파일에 Firebase 환경변수를 실제 값으로 입력하세요.
// 2. 예시는 .env.example 참고 (NEXT_PUBLIC_FIREBASE_...)
// 3. firebaseConfig는 절대 코드에 직접 노출하지 마세요.
// 4. Firebase 콘솔에서 각 값 복사 후 입력
//
// ex)
// NEXT_PUBLIC_FIREBASE_API_KEY=...
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
// ...
//
// 이 파일은 Firebase 서비스(app, auth, db, storage, analytics, performance) 초기화만 담당합니다.
//
// (디자인/기능 100% 유지, 기존 코드와 충돌 없이 적용)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

// 환경변수에서 firebaseConfig 불러오기 (실제 값은 .env에 저장)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "wiz-coco.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wiz-coco",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "wiz-coco.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdefghijklmnop",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Firebase 앱 초기화 (중복 방지) - 클라이언트 사이드에서만 실행
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
let performance: any = null;

// 클라이언트 사이드에서만 Firebase 초기화
if (typeof window !== 'undefined') {
  try {
    console.log('🔧 Firebase 클라이언트 초기화 시작');
    console.log('🔧 Firebase Config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      apiKey: firebaseConfig.apiKey ? '설정됨' : '설정되지 않음'
    });
    
    // Firebase 앱 초기화
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    
    // Firebase 서비스 초기화
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Analytics 초기화 (지원되는 경우에만)
    if (typeof window !== 'undefined') {
      isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
    }
    
    // Performance 초기화 (지원되는 경우에만)
    if (typeof window !== 'undefined') {
      try {
        performance = getPerformance(app);
      } catch (error) {
        console.warn('Firebase Performance 초기화 실패:', error);
      }
    }
    
    console.log('✅ Firebase 클라이언트 초기화 성공');
  } catch (error) {
    console.error('❌ Firebase 클라이언트 초기화 실패:', error);
  }
}

// Firebase 서비스 인스턴스 내보내기
export { app, auth, db, storage, analytics, performance };

// 기본 내보내기
export default app; 