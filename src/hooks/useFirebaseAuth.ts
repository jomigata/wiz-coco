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

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
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
    const { auth } = initializeFirebase();
    
    if (!auth) {
      console.error('Firebase Auth가 초기화되지 않았습니다.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'user', // 기본 역할
          metadata: {
            creationTime: firebaseUser.metadata.creationTime,
            lastSignInTime: firebaseUser.metadata.lastSignInTime
          }
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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