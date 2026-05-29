import { initializeApp, getApps, getApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirebaseClientConfig } from '@/lib/firebaseClientConfig';

export { getFirebaseClientConfig };

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
const performance: any = null;

export function initializeFirebase() {
  if (!app) {
    try {
      app = !getApps().length ? initializeApp(getFirebaseClientConfig()) : getApp();

      // IndexedDB persistence는 일부 환경에서 signInWithCustomToken 무한 대기 유발 → localStorage 사용
      try {
        auth = initializeAuth(app, { persistence: browserLocalPersistence });
      } catch (e: unknown) {
        const err = e as { code?: string };
        if (err?.code === 'auth/already-initialized') {
          auth = getAuth(app);
        } else {
          throw e;
        }
      }

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
