'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseSdkUser,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppRole } from '@/utils/roleUtils';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';
import {
  clearAllAuthStorage,
  evaluateAuthSessionOnStartup,
  hasAuthenticatedTabSession,
  isAuthLoginInProgress,
  markAuthenticatedTabSession,
  subscribeAuthClearEvents,
  touchAuthHeartbeat,
} from '@/utils/authSessionLifecycle';

const AUTH_CACHE_KEY = 'swr:firebaseAuthUser';
const AUTH_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const LOGOUT_DEFER_MS = 120;

const getFlaskApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) return process.env.NEXT_PUBLIC_FLASK_API_URL;
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') return window.location.origin;
  return 'http://localhost:5000';
};

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: AppRole;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

function authUserFromSdkUser(firebaseUser: FirebaseSdkUser): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: 'user',
    metadata: {
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime,
    },
  };
}

function readCachedAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  if (!hasAuthenticatedTabSession()) return null;

  const cached = readSWRCache<AuthUser>(AUTH_CACHE_KEY, {
    scope: 'session',
    maxAgeMs: AUTH_CACHE_MAX_AGE_MS,
  });
  if (cached.data) return cached.data;
  try {
    const { auth } = initializeFirebase();
    if (auth?.currentUser) return authUserFromSdkUser(auth.currentUser);
  } catch {
    // ignore
  }
  return null;
}

/** 로그인 직후 리다이렉트 시 각 페이지의 훅이 아직 동기화되기 전에 세션을 알 수 있도록 세션 캐시를 채웁니다. */
export function primeFirebaseAuthSessionCache(firebaseUser: FirebaseSdkUser): void {
  markAuthenticatedTabSession();
  writeSWRCache(AUTH_CACHE_KEY, authUserFromSdkUser(firebaseUser), { scope: 'session' });
}

type FirebaseAuthContextValue = {
  user: AuthUser | null;
  /** Firebase 세션 확인 중 (확정 전에는 로그인 필요 UI를 표시하지 않음) */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: FirebaseSdkUser; error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ success: boolean; user?: FirebaseSdkUser; error?: string }>;
  signInWithGoogle: (returnPath?: string) => Promise<{ success: boolean; user?: FirebaseSdkUser; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authExpiredOnStartupRef = useRef(false);

  // paint 전 세션 복원 (로그인 UI 깜빡임 방지)
  useLayoutEffect(() => {
    authExpiredOnStartupRef.current = evaluateAuthSessionOnStartup();
    if (authExpiredOnStartupRef.current) {
      setUser(null);
      return;
    }

    const primed = readCachedAuthUser();
    if (primed) {
      setUser((prev) => prev ?? primed);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    touchAuthHeartbeat();
    const heartbeatTimer = window.setInterval(touchAuthHeartbeat, 10_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') touchAuthHeartbeat();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  useEffect(() => {
    const { auth, db } = initializeFirebase();

    if (!auth) {
      console.error('Firebase Auth가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    let unsubscribeUserDoc: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let deferredLogoutTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let firstAuthEventHandled = false;

    const finishLoading = () => {
      if (!firstAuthEventHandled) {
        firstAuthEventHandled = true;
        setLoading(false);
      }
    };

    const applyFirebaseUser = async (firebaseUser: FirebaseSdkUser) => {
      if (deferredLogoutTimer) {
        clearTimeout(deferredLogoutTimer);
        deferredLogoutTimer = null;
      }

      markAuthenticatedTabSession();
      authExpiredOnStartupRef.current = false;
      const baseUser = authUserFromSdkUser(firebaseUser);

      try {
        if (db) {
          try {
            const token = await firebaseUser.getIdToken();
            const baseUrl = getFlaskApiBaseUrl();
            void fetch(`${baseUrl}/api/auth/bootstrap-role`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch {
            // ignore
          }

          const ref = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as { role?: AppRole };
            const role = (data?.role || 'user') as AppRole;
            const nextUser = { ...baseUser, role };
            setUser(nextUser);
            writeSWRCache(AUTH_CACHE_KEY, nextUser, { scope: 'session' });
          } else {
            await setDoc(
              ref,
              {
                role: 'user',
                email: firebaseUser.email || null,
                displayName: firebaseUser.displayName || null,
                photoURL: firebaseUser.photoURL || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
            setUser(baseUser);
            writeSWRCache(AUTH_CACHE_KEY, baseUser, { scope: 'session' });
          }

          if (unsubscribeUserDoc) unsubscribeUserDoc();
          unsubscribeUserDoc = onSnapshot(
            ref,
            (docSnap) => {
              if (!docSnap.exists()) return;
              const data = docSnap.data() as { role?: AppRole };
              const role = (data?.role || 'user') as AppRole;
              setUser((prev) => {
                const nextUser = prev ? { ...prev, role } : { ...baseUser, role };
                writeSWRCache(AUTH_CACHE_KEY, nextUser, { scope: 'session' });
                return nextUser;
              });
            },
            () => {
              // ignore realtime errors
            },
          );
        } else {
          setUser(baseUser);
          writeSWRCache(AUTH_CACHE_KEY, baseUser, { scope: 'session' });
        }
      } catch (e) {
        console.warn('[FirebaseAuth] role 로드 실패:', e);
        setUser(baseUser);
        writeSWRCache(AUTH_CACHE_KEY, baseUser, { scope: 'session' });
      } finally {
        finishLoading();
      }
    };

    const scheduleLogoutCheck = () => {
      if (deferredLogoutTimer) clearTimeout(deferredLogoutTimer);
      deferredLogoutTimer = setTimeout(async () => {
        deferredLogoutTimer = null;
        if (cancelled) return;

        try {
          await auth.authStateReady();
        } catch {
          // ignore
        }

        const cur = auth.currentUser;
        if (cur && hasAuthenticatedTabSession()) {
          const minimal = authUserFromSdkUser(cur);
          setUser((prev) => prev ?? minimal);
          writeSWRCache(AUTH_CACHE_KEY, minimal, { scope: 'session' });
          finishLoading();
          return;
        }

        const cached = readSWRCache<AuthUser>(AUTH_CACHE_KEY, {
          scope: 'session',
          maxAgeMs: AUTH_CACHE_MAX_AGE_MS,
        });
        if (cached.data && hasAuthenticatedTabSession()) {
          setUser((prev) => prev ?? cached.data);
          finishLoading();
          return;
        }

        setUser(null);
        writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
        finishLoading();
      }, LOGOUT_DEFER_MS);
    };

    const loadingSafetyTimer = setTimeout(() => {
      if (!cancelled) finishLoading();
    }, 8000);

    const unsubscribeAuthClear = subscribeAuthClearEvents(() => {
      setUser(null);
      writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
    });

    void (async () => {
      try {
        await auth.authStateReady();
      } catch {
        // ignore
      }

      if (cancelled) return;

      if (authExpiredOnStartupRef.current && !isAuthLoginInProgress()) {
        if (auth.currentUser && !hasAuthenticatedTabSession()) {
          try {
            await signOut(auth);
          } catch {
            // ignore
          }
        }
        writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
        setUser(null);
      }

      if (cancelled) return;

      unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          if (!hasAuthenticatedTabSession() && !isAuthLoginInProgress()) {
            void clearAllAuthStorage().then(() => {
              setUser(null);
              writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
              finishLoading();
            });
            return;
          }
          void applyFirebaseUser(firebaseUser);
          return;
        }
        scheduleLogoutCheck();
      });
    })();

    return () => {
      cancelled = true;
      clearTimeout(loadingSafetyTimer);
      if (deferredLogoutTimer) clearTimeout(deferredLogoutTimer);
      unsubscribeAuthClear();
      unsubscribeAuth?.();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return { success: true, user: result.user };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const signInWithGoogle = useCallback(async (returnPath?: string) => {
    const result = await AccountIntegrationManager.signInWithGoogle(returnPath);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      await clearAllAuthStorage();
      setUser(null);
      writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
      resetPassword,
    }),
    [user, loading, signIn, signUp, signInWithGoogle, logout, resetPassword],
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return ctx;
}
