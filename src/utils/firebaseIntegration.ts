// Firebase 통합 유틸리티
// 모든 Firebase 서비스를 통합하여 사용하는 기능 제공

import { auth, db, storage, analytics, performance } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

/**
 * Firebase 서비스 상태 확인
 */
export function checkFirebaseServices() {
  const services = {
    auth: !!auth,
    firestore: !!db,
    storage: !!storage,
    analytics: !!analytics,
    performance: !!performance
  };
  
  console.log('Firebase 서비스 상태:', services);
  return services;
}

/**
 * 사용자 인증 상태 모니터링
 * @param callback - 상태 변경 콜백 함수
 * @returns () => void - 구독 해제 함수
 */
export function monitorAuthState(callback: (user: User | null) => void) {
  if (!auth) return;
  return onAuthStateChanged(auth, (user) => {
    if (user && analytics) {
      setUserId(analytics, user.uid);
      setUserProperties(analytics, {
        email: user.email || '',
        provider: user.providerId || '',
      });
    }
    callback(user);
  });
}

/**
 * 사용자 프로필 관리
 */
export const userProfile = {
  /**
   * 사용자 프로필 생성/업데이트
   */
  async updateProfile(userId: string, profileData: any) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      }, { merge: true });
      
      if (analytics) {
        logEvent(analytics, 'profile_update', {
          user_id: userId
        });
      }
      
      return true;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자 프로필 조회
   */
  async getProfile(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      throw error;
    }
  }
};

/**
 * 테스트 결과 관리
 */
export const testResults = {
  /**
   * 테스트 결과 저장
   */
  async saveTestResult(testData: any) {
    try {
      const testRef = await addDoc(collection(db, 'test_results'), {
        ...testData,
        createdAt: new Date()
      });
      
      if (analytics) {
        logEvent(analytics, 'test_result_saved', {
          test_type: testData.testType,
          result_id: testRef.id
        });
      }
      
      return testRef.id;
    } catch (error) {
      console.error('테스트 결과 저장 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자의 테스트 결과 조회
   */
  async getUserTestResults(userId: string) {
    try {
      const q = query(
        collection(db, 'test_results'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('테스트 결과 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 테스트 코드로 결과 조회
   */
  async getTestResultByCode(testCode: string) {
    try {
      const q = query(
        collection(db, 'test_results'),
        where('code', '==', testCode),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('테스트 결과 조회 실패:', error);
      throw error;
    }
  }
};

/**
 * 파일 관리
 */
export const fileManager = {
  /**
   * 파일 업로드
   */
  async uploadFile(file: File, path: string) {
    if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      if (analytics) {
        logEvent(analytics, 'file_uploaded', {
          file_name: file.name,
          file_size: file.size,
          file_path: path
        });
      }
      
      return downloadURL;
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      throw error;
    }
  },

  /**
   * 파일 삭제
   */
  async deleteFile(path: string) {
    if (!storage) throw new Error('Firebase Storage가 초기화되지 않았습니다.');
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      if (analytics) {
        logEvent(analytics, 'file_deleted', {
          file_path: path
        });
      }
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      throw error;
    }
  }
};

/**
 * 통계 및 분석
 */
export const analyticsManager = {
  /**
   * 페이지 뷰 로깅
   */
  logPageView(pageName: string) {
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_name: pageName,
        page_url: window.location.href
      });
    }
  },

  /**
   * 테스트 시작 로깅
   */
  logTestStart(testType: string) {
    if (analytics) {
      logEvent(analytics, 'test_start', {
        test_type: testType
      });
    }
  },

  /**
   * 테스트 완료 로깅
   */
  logTestComplete(testType: string, result: string, duration: number) {
    if (analytics) {
      logEvent(analytics, 'test_complete', {
        test_type: testType,
        result: result,
        duration: duration
      });
    }
  },

  /**
   * 오류 로깅
   */
  logError(errorCode: string, errorMessage: string, location: string) {
    if (analytics) {
      logEvent(analytics, 'error', {
        error_code: errorCode,
        error_message: errorMessage,
        location: location
      });
    }
  }
};

/**
 * 인증 관리
 */
export const authManager = {
  /**
   * 이메일/비밀번호 로그인
   */
  async signInWithEmail(email: string, password: string) {
    if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (analytics) {
        logEvent(analytics, 'login', {
          method: 'email'
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  },

  /**
   * 회원가입
   */
  async signUpWithEmail(email: string, password: string, displayName: string) {
    if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await userProfile.updateProfile(userCredential.user.uid, {
        email: email,
        displayName: displayName,
        createdAt: new Date()
      });
      
      if (analytics) {
        logEvent(analytics, 'sign_up', {
          method: 'email'
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
  },

  /**
   * 로그아웃
   */
  async signOut() {
    if (!auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    try {
      await signOut(auth);
      
      if (analytics) {
        logEvent(analytics, 'logout');
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  }
}; 