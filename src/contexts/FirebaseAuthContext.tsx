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
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppRole } from '@/utils/roleUtils';
import { getBootstrapRoleForEmail } from '@/constants/bootstrapAccounts';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';
import {
  clearAllAuthStorage,
  evaluateAuthSessionOnStartup,
  hasAuthenticatedTabSession,
  isAuthLoginInProgress,
  markAuthenticatedTabSession,
  subscribeAuthClearEvents,
  touchAuthHeartbeat,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';
import { primeCounselorIdToken, clearCounselorIdTokenCache } from '@/lib/counselorAuth';
import { clearClientPortalSessionWithBroadcast } from '@/lib/clientPortalSession';

const AUTH_CACHE_KEY = 'swr:firebaseAuthUser';
const AUTH_CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const LOGOUT_DEFER_MS = 120;
const LOADING_SAFETY_MS = 2000;
const LOGIN_LOGOUT_DEFER_MS = 400;

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

function isPrivilegedRole(role: unknown): role is AppRole {
  return role === 'counselor' || role === 'admin' || role === 'org_admin';
}

/** quick hydrate 중 privileged role을 user로 덮어쓰지 않음 */
function resolveHydrationRole(
  uid: string,
  quickRole: AppRole,
  prev: AuthUser | null,
): AppRole {
  if (prev?.uid === uid && isPrivilegedRole(prev.role)) return prev.role;
  const cached = readSWRCache<AuthUser>(AUTH_CACHE_KEY, {
    scope: 'session',
    maxAgeMs: AUTH_CACHE_MAX_AGE_MS,
  });
  if (cached.data?.uid === uid && isPrivilegedRole(cached.data.role)) {
    return cached.data.role as AppRole;
  }
  return quickRole;
}

function readCachedAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  if (!hasAuthenticatedTabSession()) return null;

  const cached = readSWRCache<AuthUser>(AUTH_CACHE_KEY, {
    scope: 'session',
    maxAgeMs: AUTH_CACHE_MAX_AGE_MS,
  });

  try {
    const { auth } = initializeFirebase();
    if (auth?.currentUser) {
      const base = authUserFromSdkUser(auth.currentUser);
      if (cached.data && cached.data.uid === base.uid) {
        return {
          ...base,
          role: cached.data.role || base.role,
          displayName: cached.data.displayName ?? base.displayName,
          photoURL: cached.data.photoURL ?? base.photoURL,
        };
      }
      return base;
    }
  } catch {
    // ignore
  }

  // Firebase 세션 없이 SWR 캐시만 남은 경우 — 만료된 UI 상태 방지
  if (!isAuthLoginInProgress()) {
    sessionStorage.removeItem('wizcoco:auth-tab-session');
    return null;
  }

  if (cached.data) return cached.data;
  return null;
}

/** 로그인 직후 리다이렉트 시 각 페이지의 훅이 아직 동기화되기 전에 세션을 알 수 있도록 세션 캐시를 채웁니다. */
export function primeFirebaseAuthSessionCache(firebaseUser: FirebaseSdkUser): void {
  markAuthenticatedTabSession();
  writeSWRCache(AUTH_CACHE_KEY, authUserFromSdkUser(firebaseUser), { scope: 'session' });
  void firebaseUser.getIdToken().then((token) => primeCounselorIdToken(token)).catch(() => null);
}

type FirebaseAuthContextValue = {
  user: AuthUser | null;
  /** Firebase 세션 확인 중 (확정 전에는 로그인 필요 UI를 표시하지 않음) */
  loading: boolean;
  /** Firestore/API에서 role 확정 전 — RoleGuard 등에서 조기 리다이렉트 방지 */
  roleHydrating: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; user?: FirebaseSdkUser; error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ success: boolean; user?: FirebaseSdkUser; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleHydrating, setRoleHydrating] = useState(true);
  const authExpiredOnStartupRef = useRef(false);

  // paint 전 세션 복원 (로그인 UI 깜빡임 방지)
  useLayoutEffect(() => {
    authExpiredOnStartupRef.current = evaluateAuthSessionOnStartup();
    if (authExpiredOnStartupRef.current) {
      setUser(null);
      setLoading(false);
      setRoleHydrating(false);
      return;
    }

    const primed = readCachedAuthUser();
    if (primed) {
      setUser((prev) => prev ?? primed);
      setLoading(false);
      setRoleHydrating(!(primed.role && primed.role !== 'user'));
      return;
    }

    if (isAuthLoginInProgress() && hasAuthenticatedTabSession()) {
      setLoading(false);
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
      clearClientPortalSessionWithBroadcast();
      authExpiredOnStartupRef.current = false;
      const baseUser = authUserFromSdkUser(firebaseUser);

      const bootstrapRole: AppRole = getBootstrapRoleForEmail(firebaseUser.email) || 'user';
      // auth 이벤트마다 role을 user로 초기화하면 RoleGuard가 상담관리 허브를 신청 페이지로 보냄
      const cachedSnap = readSWRCache<AuthUser>(AUTH_CACHE_KEY, {
        scope: 'session',
        maxAgeMs: AUTH_CACHE_MAX_AGE_MS,
      });
      const cachedPrivileged =
        cachedSnap.data?.uid === firebaseUser.uid && isPrivilegedRole(cachedSnap.data.role)
          ? (cachedSnap.data.role as AppRole)
          : null;

      setUser((prev) => {
        const role =
          (prev?.uid === firebaseUser.uid && isPrivilegedRole(prev.role) ? prev.role : null) ||
          cachedPrivileged ||
          bootstrapRole;
        const nextUser = { ...baseUser, role };
        writeSWRCache(AUTH_CACHE_KEY, nextUser, { scope: 'session' });
        return nextUser;
      });
      setRoleHydrating(!(cachedPrivileged || isPrivilegedRole(bootstrapRole)));
      finishLoading();
      void firebaseUser.getIdToken().then((token) => primeCounselorIdToken(token)).catch(() => null);

      if (!db) {
        setRoleHydrating(false);
        return;
      }

      void (async () => {
        try {
          let resolvedRole = bootstrapRole;
          const tokenPromise = firebaseUser.getIdToken();
          const ref = doc(db, 'users', firebaseUser.uid);
          const snapPromise = getDoc(ref);

          const roleFromApiPromise = tokenPromise.then(async (token) => {
            const baseUrl = getFlaskApiBaseUrl();
            const headers = { Authorization: `Bearer ${token}` };
            void fetch(`${baseUrl}/api/auth/link-legacy-data`, {
              method: 'POST',
              headers,
            }).catch(() => null);
            try {
              const bootstrapRes = await fetch(`${baseUrl}/api/auth/bootstrap-role`, {
                method: 'POST',
                headers,
              });
              if (bootstrapRes.ok) {
                const boot = (await bootstrapRes.json().catch(() => ({}))) as { role?: AppRole };
                if (
                  boot.role === 'admin' ||
                  boot.role === 'counselor' ||
                  boot.role === 'org_admin' ||
                  boot.role === 'user'
                ) {
                  return boot.role;
                }
              }
            } catch {
              // ignore
            }
            return bootstrapRole;
          });

          const [snap, roleFromApi] = await Promise.all([snapPromise, roleFromApiPromise]);
          resolvedRole = roleFromApi;
          if (!snap.exists()) {
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
          }

          const role = (
            snap.exists()
              ? ((snap.data() as { role?: AppRole })?.role || resolvedRole)
              : resolvedRole
          ) as AppRole;
          setUser((prev) => {
            const nextUser = prev ? { ...prev, role } : { ...baseUser, role };
            writeSWRCache(AUTH_CACHE_KEY, nextUser, { scope: 'session' });
            return nextUser;
          });

          const finishRoleHydration = () => setRoleHydrating(false);
          const privilegedRole = role === 'counselor' || role === 'admin' || role === 'org_admin';
          if (privilegedRole) {
            finishRoleHydration();
          }

          if (unsubscribeUserDoc) unsubscribeUserDoc();
          let snapshotHandled = false;
          unsubscribeUserDoc = onSnapshot(
            ref,
            (docSnap) => {
              if (!docSnap.exists()) return;
              const data = docSnap.data() as { role?: AppRole };
              const liveRole = (data?.role || 'user') as AppRole;
              setUser((prev) => {
                const nextUser = prev ? { ...prev, role: liveRole } : { ...baseUser, role: liveRole };
                writeSWRCache(AUTH_CACHE_KEY, nextUser, { scope: 'session' });
                return nextUser;
              });
              if (!snapshotHandled) {
                snapshotHandled = true;
                finishRoleHydration();
              }
            },
            () => {
              if (!snapshotHandled) finishRoleHydration();
            },
          );

          if (!privilegedRole) {
            window.setTimeout(() => {
              if (!snapshotHandled) finishRoleHydration();
            }, 2500);
          }
        } catch (e) {
          console.warn('[FirebaseAuth] role 로드 실패:', e);
          setRoleHydrating(false);
        }
      })();
    };

    const scheduleLogoutCheck = () => {
      if (deferredLogoutTimer) clearTimeout(deferredLogoutTimer);
      const loginGrace =
        isAuthLoginInProgress() && (hasAuthenticatedTabSession() || Boolean(readCachedAuthUser()));
      const deferMs = loginGrace ? LOGIN_LOGOUT_DEFER_MS : LOGOUT_DEFER_MS;
      deferredLogoutTimer = setTimeout(async () => {
        deferredLogoutTimer = null;
        if (cancelled) return;

        try {
          await auth.authStateReady();
        } catch {
          // ignore
        }

        const cur = auth.currentUser;
        if (cur) {
          if (!hasAuthenticatedTabSession() && !authExpiredOnStartupRef.current) {
            tryRestoreAuthenticatedTabSession();
          }
          if (hasAuthenticatedTabSession() || authExpiredOnStartupRef.current === false) {
            const minimal = authUserFromSdkUser(cur);
            setUser((prev) => prev ?? minimal);
            writeSWRCache(AUTH_CACHE_KEY, minimal, { scope: 'session' });
            finishLoading();
            return;
          }
        }

        setUser(null);
        writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
        clearCounselorIdTokenCache();
        setRoleHydrating(false);
        finishLoading();
      }, deferMs);
    };

    const loadingSafetyTimer = setTimeout(() => {
      if (!cancelled) finishLoading();
    }, LOADING_SAFETY_MS);

    const unsubscribeAuthClear = subscribeAuthClearEvents(() => {
      setUser(null);
      writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
      clearCounselorIdTokenCache();
      setRoleHydrating(false);
    });

    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
        if (!hasAuthenticatedTabSession() && !isAuthLoginInProgress()) {
          if (authExpiredOnStartupRef.current) {
            if (!tryRestoreAuthenticatedTabSession()) {
              void clearAllAuthStorage().then(() => {
                setUser(null);
                writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
                clearCounselorIdTokenCache();
                finishLoading();
              });
              return;
            }
            authExpiredOnStartupRef.current = false;
          } else {
            tryRestoreAuthenticatedTabSession();
          }
        }
        void applyFirebaseUser(firebaseUser);
        return;
      }
      scheduleLogoutCheck();
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
        clearCounselorIdTokenCache();
        setUser(null);
        finishLoading();
      }
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

  const logout = useCallback(async () => {
    try {
      await clearAllAuthStorage({ fullReset: true });
      setUser(null);
      writeSWRCache(AUTH_CACHE_KEY, null, { scope: 'session' });
      clearCounselorIdTokenCache();
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
      roleHydrating,
      signIn,
      signUp,
      logout,
      resetPassword,
    }),
    [user, loading, roleHydrating, signIn, signUp, logout, resetPassword],
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
