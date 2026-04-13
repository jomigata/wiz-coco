// Firebase Authentication 커스텀 훅
// 인증 상태 관리 및 사용자 정보 처리

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { AppRole } from '@/utils/roleUtils';

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

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 초기화
    const { auth, db } = initializeFirebase();
    
    if (!auth) {
      console.error('Firebase Auth가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    let unsubscribeUserDoc: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
        return;
      }

      const baseUser: AuthUser = {
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

      // Firestore /users/{uid}에서 role 읽기 (없으면 기본 user로 생성)
      try {
        if (db) {
          // 백엔드 부트스트랩(운영자/상담사 자동 승격) 트리거
          // - 실패해도 무시(오프라인/배포 환경 차이)
          // - 성공 시 onSnapshot으로 role이 즉시 반영됨
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
            const data = snap.data() as any;
            const role = (data?.role || 'user') as AppRole;
            setUser({ ...baseUser, role });
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
              { merge: true }
            );
            setUser(baseUser);
          }

          // role 변경을 실시간 반영 (관리자/상담사 승격 시 메뉴 즉시 갱신)
          if (unsubscribeUserDoc) unsubscribeUserDoc();
          unsubscribeUserDoc = onSnapshot(
            ref,
            (docSnap) => {
              if (!docSnap.exists()) return;
              const data = docSnap.data() as any;
              const role = (data?.role || 'user') as AppRole;
              setUser((prev) => (prev ? { ...prev, role } : { ...baseUser, role }));
            },
            () => {
              // ignore realtime errors (offline 등)
            }
          );
        } else {
          setUser(baseUser);
        }
      } catch (e) {
        console.warn('[useFirebaseAuth] role 로드 실패:', e);
        setUser(baseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        // 사용자 프로필 업데이트
        await updateProfile(result.user, { displayName });
      }
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword
  };
}; 