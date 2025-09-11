'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { getSession, signIn } from 'next-auth/react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AccountIntegrationManager } from '@/utils/accountIntegration';

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
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Register] 로그인 상태 확인 시작');
        
        const session = await getSession();
        if (session) {
          console.log('[Register] 이미 로그인된 상태:', session);
          setIsLoggedIn(true);
          
          // 마이페이지로 리다이렉트
          setTimeout(() => {
            router.replace('/mypage');
          }, 100);
          return;
        }
        
        console.log('[Register] 인증되지 않은 상태');
      } catch (error) {
        console.error('[Register] 인증 상태 확인 오류:', error);
      }
    };
    
    checkAuthStatus();
  }, [router]);
  
  // 회원가입 처리 함수
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!name.trim()) {
      setRegisterError('이름을 입력해주세요.');
      return;
    }
    
    if (!email || !password) {
      setRegisterError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegisterError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    // 비밀번호 길이 검증
    if (password.length < 6) {
      setRegisterError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    // 로딩 상태 시작
    setIsLoading(true);
    setRegisterError('');
    
    try {
      console.log('[Register] 통합 회원가입 시도:', email);
      
      // 통합 회원가입 시도
      const result = await AccountIntegrationManager.signUpWithEmail(email, password, name);
      
      if (result.success) {
        console.log('[Register] 통합 회원가입 성공:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        
        // 이메일 인증 안내와 함께 로그인 페이지로 리다이렉트
        router.push('/login?registered=true&emailVerification=sent');
        return;
      } else {
        setRegisterError(result.error || '회원가입 처리 중 오류가 발생했습니다.');
        return;
      }
      
    } catch (error: any) {
      console.error('[Register] 통합 회원가입 오류:', error);
      setRegisterError('회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);
      setRegisterError('');
      
      console.log(`[Register] ${provider} 소셜 로그인 시도`);
      
      if (provider === 'google') {
        const result = await AccountIntegrationManager.signInWithGoogle();
        
        if (result.success) {
          console.log('[Register] Google 소셜 로그인 성공:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          });
          
          // 마이페이지로 리다이렉트
          router.push('/mypage');
        } else {
          setRegisterError(result.error || 'Google 로그인 처리 중 오류가 발생했습니다.');
        }
      } else if (provider === 'naver') {
        const result = await AccountIntegrationManager.signInWithNaver();
        
        if (result.success) {
          console.log('[Register] Naver 소셜 로그인 성공');
          
          // 마이페이지로 리다이렉트
          router.push('/mypage');
        } else {
          setRegisterError(result.error || 'Naver 로그인 처리 중 오류가 발생했습니다.');
        }
      } else if (provider === 'kakao') {
        const result = await AccountIntegrationManager.signInWithKakao();
        
        if (result.success) {
          console.log('[Register] Kakao 소셜 로그인 성공');
          
          // 마이페이지로 리다이렉트
          router.push('/mypage');
        } else {
          setRegisterError(result.error || 'Kakao 로그인 처리 중 오류가 발생했습니다.');
        }
      } else {
        // 기타 제공자는 NextAuth를 사용
        await signIn(provider, { callbackUrl: '/mypage' });
      }
    } catch (error: any) {
      console.error(`[Register] ${provider} 로그인 오류:`, error);
      setRegisterError(`${provider} 로그인 처리 중 오류가 발생했습니다.`);
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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
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

          {/* 소셜 로그인 버튼 */}
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
                onClick={() => handleSocialLogin('google')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                Google
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialLogin('kakao')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                Kakao
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialLogin('naver')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
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
                로그인
              </Link>
              <Link href="/forgot-password" className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                비밀번호를 잊으셨나요?
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