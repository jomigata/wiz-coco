'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { signIn, getSession } from 'next-auth/react';

// 로딩 컴포넌트
const LoadingLogin = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <Navigation />
    <div className="h-20"></div>
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-300 text-lg">로그인 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

// 클라이언트 컴포넌트
const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const redirectUrl = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(registered);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // 로그인 상태 체크
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Login] 로그인 상태 확인 시작');
        
        const session = await getSession();
        if (session) {
          console.log('[Login] 이미 로그인된 상태:', session);
          setIsLoggedIn(true);
          
          // 리다이렉트 처리
          setTimeout(() => {
            router.replace(redirectUrl);
          }, 100);
          return;
        }
        
        console.log('[Login] 인증되지 않은 상태');
      } catch (error) {
        console.error('[Login] 인증 상태 확인 오류:', error);
      }
    };
    
    checkAuthStatus();
  }, [router, redirectUrl]);
  
  // 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!email || !password) {
      setLoginError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    // 로딩 상태 시작
    setIsLoading(true);
    setLoginError('');
    
    try {
      console.log('[Login] 로그인 시도:', email);
      
      // NextAuth로 로그인 시도
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        // 에러 메시지 처리
        let errorMsg = '로그인 처리 중 오류가 발생했습니다.';
        if (result.error.includes('CredentialsSignin')) {
          errorMsg = '이메일 또는 비밀번호가 일치하지 않습니다.';
        }
        setLoginError(errorMsg);
        return;
      }
      
      if (result?.ok) {
        console.log('[Login] 로그인 성공');
        setIsLoggedIn(true);
        
        // 리다이렉트 처리
        setTimeout(() => {
          router.replace(redirectUrl);
        }, 100);
      }
    } catch (error: any) {
      console.error('[Login] 로그인 오류:', error);
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);
      await signIn(provider, { callbackUrl: redirectUrl });
    } catch (error) {
      console.error(`[Login] ${provider} 로그인 오류:`, error);
      setLoginError(`${provider} 로그인 처리 중 오류가 발생했습니다.`);
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
            <h2 className="text-3xl font-bold text-emerald-200 mb-2">로그인</h2>
            <p className="text-emerald-400">심리케어 서비스를 이용하기 위해 로그인해주세요.</p>
          </div>

          {registrationSuccess && (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center mb-4">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="비밀번호"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3" aria-live="assertive">
                {loginError}
              </div>
            )}

            <div>
              <motion.button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                aria-label="로그인 제출"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </div>
                ) : (
                  "로그인"
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
              심리케어 서비스 사용을 위한 계정이 필요하신가요?
            </p>
            <div className="space-y-2">
              <Link href="/register" className="block text-emerald-300 hover:text-emerald-200 font-medium transition-colors">
                회원가입
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
const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingLogin />}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;