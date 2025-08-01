'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { getSession } from 'next-auth/react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// 로딩 컴포넌트
const LoadingRegister = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <Navigation />
    <div className="h-20"></div>
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-300 text-lg">회원가입 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

// 클라이언트 컴포넌트
const RegisterContent = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [registerError, setRegisterError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [firebaseInitialized, setFirebaseInitialized] = useState<boolean>(false);
  
  // Firebase 초기화 확인
  useEffect(() => {
    const checkFirebase = () => {
      if (auth) {
        console.log('[Register] Firebase Auth 초기화 확인됨');
        setFirebaseInitialized(true);
      } else {
        console.log('[Register] Firebase Auth 초기화 대기 중...');
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  }, []);
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Register] 로그인 상태 확인 시작');
        
        const session = await getSession();
        if (session) {
          console.log('[Register] 이미 로그인된 상태:', session);
          setIsLoggedIn(true);
          router.push('/mypage');
        }
        
        console.log('[Register] 인증되지 않은 상태');
      } catch (error) {
        console.error('[Register] 인증 상태 확인 오류:', error);
      }
    };
    
    checkAuthStatus();
  }, [router]);
  
  // 폼 유효성 검사
  const validateForm = (): boolean => {
    if (!name.trim()) {
      setRegisterError('이름을 입력해주세요.');
      return false;
    }

    if (!email.trim()) {
      setRegisterError('이메일을 입력해주세요.');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRegisterError('유효한 이메일 주소를 입력해주세요.');
      return false;
    }

    if (!password) {
      setRegisterError('비밀번호를 입력해주세요.');
      return false;
    } else if (password.length < 6) {
      setRegisterError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    return true;
  };
  
  // 회원가입 처리 함수 (클라이언트 사이드 Firebase Auth 사용)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Firebase 초기화 확인
    if (!firebaseInitialized) {
      setRegisterError('Firebase가 초기화되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setRegisterError('');
      
      console.log('[Register] 회원가입 시도:', email);
      
      // Firebase Auth로 직접 회원가입
      if (!auth) {
        throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      }

      // 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 사용자 프로필 업데이트 (이름 설정)
      await updateProfile(user, {
        displayName: name
      });

      console.log('[Register] Firebase 회원가입 성공:', user.uid);
      
      // 성공 메시지 표시 후 로그인 페이지로 리다이렉트
      alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      router.push('/login?registered=true');
      
    } catch (error: any) {
      console.error('[Register] 회원가입 오류:', error);
      
      // Firebase Auth 에러 처리
      let errorMessage = '회원가입 처리 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일 주소입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '이메일/비밀번호 로그인이 비활성화되어 있습니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      setRegisterError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 회원가입 처리
  const handleSocialRegister = async (provider: string) => {
    try {
      setIsLoading(true);
      setRegisterError('');
      
      if (!auth) {
        throw new Error('Firebase Auth가 초기화되지 않았습니다.');
      }

      let authProvider;
      
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'kakao':
          // Kakao는 Firebase에서 직접 지원하지 않으므로 안내 메시지
          setRegisterError('Kakao 로그인은 현재 준비 중입니다.');
          return;
        case 'naver':
          // Naver는 Firebase에서 직접 지원하지 않으므로 안내 메시지
          setRegisterError('Naver 로그인은 현재 준비 중입니다.');
          return;
        default:
          setRegisterError('지원하지 않는 로그인 방식입니다.');
          return;
      }

      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;

      console.log(`[Register] ${provider} 소셜 로그인 성공:`, user.uid);
      
      // 마이페이지로 리다이렉트
      router.push('/mypage');
      
    } catch (error: any) {
      console.error(`[Register] ${provider} 회원가입 오류:`, error);
      
      let errorMessage = `${provider} 회원가입 처리 중 오류가 발생했습니다.`;
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = '로그인이 취소되었습니다.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = '이미 다른 방법으로 가입된 계정입니다.';
      }
      
      setRegisterError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-200 mb-2">회원가입</h2>
            <p className="text-emerald-400">심리케어 서비스 이용을 위한 계정을 만들어보세요.</p>
          </div>
          
          {!firebaseInitialized && (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-emerald-300 text-sm">Firebase 초기화 중...</p>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="이름"
                  disabled={!firebaseInitialized || isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="sr-only">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="이메일"
                  disabled={!firebaseInitialized || isLoading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="sr-only">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="비밀번호 (6자 이상)"
                  disabled={!firebaseInitialized || isLoading}
                />
              </div>
            </div>

            {registerError && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3" aria-live="assertive">
                {registerError}
              </div>
            )}

            <div>
              <motion.button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!firebaseInitialized || isLoading}
                aria-label="회원가입 제출"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    가입 중...
                  </div>
                ) : (
                  "가입하기"
                )}
              </motion.button>
            </div>
          </form>

          {/* 소셜 회원가입 버튼 */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-emerald-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-emerald-900/30 text-emerald-400">또는</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                onClick={() => handleSocialRegister('google')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!firebaseInitialized || isLoading}
              >
                Google
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialRegister('kakao')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!firebaseInitialized || isLoading}
              >
                Kakao
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialRegister('naver')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!firebaseInitialized || isLoading}
              >
                Naver
              </motion.button>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-emerald-400">
              이미 계정이 있으신가요?
            </p>
            <div className="space-y-2">
              <Link href="/login" className="block text-emerald-300 hover:text-emerald-200 font-medium transition-colors">
                로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 페이지 컴포넌트
const RegisterPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingRegister />}>
      <RegisterContent />
    </Suspense>
  );
};

export default RegisterPage; 