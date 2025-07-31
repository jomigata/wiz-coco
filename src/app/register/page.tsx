'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { getSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';

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
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const session = await getSession();
        if (session) {
          setIsLoggedIn(true);
          router.push('/mypage');
        }
      } catch (error) {
        console.error('[Register] 인증 상태 확인 오류:', error);
      }
    };
    
    checkAuthStatus();
  }, [router]);
  
  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
      name?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 6) {
      newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // 회원가입 처리 함수
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrors({});
      
      // 회원가입 API 호출
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrors({ general: data.error || '회원가입 처리 중 오류가 발생했습니다.' });
        return;
      }
      
      // 회원가입 성공
      console.log('[Register] 회원가입 성공:', data);
      
      // 로그인 페이지로 리다이렉트
      router.push('/login?registered=true');
      
    } catch (error: any) {
      console.error('[Register] 회원가입 오류:', error);
      setErrors({ general: '회원가입 처리 중 오류가 발생했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 회원가입 처리
  const handleSocialRegister = async (provider: string) => {
    try {
      setIsLoading(true);
      // 소셜 로그인으로 회원가입 처리 (NextAuth의 signIn 사용)
      await signIn(provider, { callbackUrl: '/mypage' });
    } catch (error) {
      console.error(`[Register] ${provider} 회원가입 오류:`, error);
      setErrors({ general: `${provider} 회원가입 처리 중 오류가 발생했습니다.` });
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
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
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
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
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
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            {errors.general && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3" aria-live="assertive">
                {errors.general}
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
                    처리 중...
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
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                Google
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialRegister('kakao')}
                className="flex justify-center items-center px-4 py-2 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-lg hover:bg-emerald-800/50 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoading}
              >
                Kakao
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialRegister('naver')}
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