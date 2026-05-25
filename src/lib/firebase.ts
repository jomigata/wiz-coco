import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirebaseAuthDomain } from '@/lib/firebaseAuthDomain';

function buildFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: getFirebaseAuthDomain(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
const performance: any = null;

export function initializeFirebase() {
  if (!app) {
    try {
      app = !getApps().length ? initializeApp(buildFirebaseConfig()) : getApp();

      // setPersistence 호출 없이 Firebase 기본 persistence(IndexedDB) 사용
      // setPersistence가 Firebase 내부 큐에 pending 상태로 쌓이면
      // signInWithRedirect가 완료될 때까지 블록되어 OAuth 이동이 안 됨
      auth = getAuth(app);

      db = getFirestore(app);
      storage = getStorage(app);

      if (typeof window !== 'undefined') {
        isSupported().then((yes) => (yes ? (analytics = getAnalytics(app)) : null));
        // Firebase Performance 비활성화 (invalid-attribute-value 오류 방지)
      }
    } catch (error) {
      console.error('❌ Firebase 초기화 실패:', error);
      throw error;
    }
  }
  return { app, auth, db, storage, analytics, performance };
}

export { app, auth, db, storage, analytics, performance };
export default app;
