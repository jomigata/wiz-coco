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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 서비스 인스턴스 내보내기
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
let performance: any = null;

// Firebase 초기화 함수
export function initializeFirebase() {
  if (!app) {
    try {
      // Firebase 앱 초기화
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      
      // Firebase 서비스 초기화
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      
      // 클라이언트 사이드에서만 Analytics와 Performance 초기화
      if (typeof window !== 'undefined') {
        // Analytics 초기화 (지원되는 경우에만)
        isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
        
        // Performance 초기화 (지원되는 경우에만)
        try {
          performance = getPerformance(app);
        } catch (error) {
          console.warn('Firebase Performance 초기화 실패:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Firebase 초기화 실패:', error);
      throw error;
    }
  }
  return { app, auth, db, storage, analytics, performance };
}

// Firebase 서비스 인스턴스 내보내기
export { app, auth, db, storage, analytics, performance };

// 기본 내보내기
export default app; 