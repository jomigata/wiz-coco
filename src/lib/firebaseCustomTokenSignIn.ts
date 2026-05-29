/**
 * Custom Token 로그인 — modular SDK가 IndexedDB에서 멈출 때 compat 경로 사용
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirebaseClientConfig } from '@/lib/firebaseClientConfig';

const FIREBASE_IDB_NAME = 'firebaseLocalStorageDb';

function clearFirebaseAuthIdb(): Promise<void> {
  if (typeof indexedDB === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(FIREBASE_IDB_NAME);
      const done = () => resolve();
      req.onsuccess = done;
      req.onerror = done;
      req.onblocked = done;
    } catch {
      resolve();
    }
  });
}

function ensureCompatAuth(): firebase.auth.Auth {
  const config = getFirebaseClientConfig();
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }
  return firebase.auth();
}

function waitForCompatUser(auth: firebase.auth.Auth, timeoutMs: number): Promise<firebase.User> {
  const existing = auth.currentUser;
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      unsub();
      reject(new Error('Firebase 로그인 시간 초과'));
    }, timeoutMs);

    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        window.clearTimeout(timer);
        unsub();
        resolve(user);
      }
    });
  });
}

/**
 * Google OAuth 등 서버 custom token → Firebase 세션
 * (compat 단일 경로 — modular signInWithCustomToken IndexedDB hang 회피)
 */
export async function signInWithAppCustomToken(customToken: string): Promise<void> {
  await clearFirebaseAuthIdb();
  const compatAuth = ensureCompatAuth();
  await compatAuth.signInWithCustomToken(customToken);
  await waitForCompatUser(compatAuth, 25_000);
}
