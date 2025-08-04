'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { getSession } from 'next-auth/react';

const RegisterPage: React.FC = () => {
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      
      <div className="h-20"></div>
      
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-900/50 backdrop-blur-sm rounded-3xl shadow-lg p-8 w-full max-w-md border border-emerald-700/50"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">회원가입</h1>
            <p className="text-emerald-200 mt-2">
              심리케어 서비스 이용을 위한 계정을 만들어보세요.
            </p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-md text-sm" aria-live="assertive">
                {errors.general}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-emerald-200 mb-2">
                이름 <span className="text-red-300">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-emerald-800/50 border border-emerald-700/20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="이름을 입력하세요"
                required
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-emerald-200 mb-2">
                이메일 <span className="text-red-300">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-emerald-800/50 border border-emerald-700/20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="이메일을 입력하세요"
                required
                autoComplete="email"
              />
              {errors.email && (
                <div className="mt-1 flex justify-between items-center">
                  <p className="text-sm text-red-400">{errors.email}</p>
                  <Link href="/forgot-password" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">
                    비밀번호 찾기
                  </Link>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-emerald-200 mb-2">
                비밀번호 <span className="text-red-300">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-emerald-800/50 border border-emerald-700/20 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="비밀번호를 입력하세요 (6자 이상)"
                required
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
            
            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl shadow-md hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900 relative"
                disabled={isLoading}
                aria-label="회원가입 제출"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </div>
                ) : '가입하기'}
              </motion.button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-emerald-700/30 text-center">
            <p className="text-sm text-emerald-300/80">
              이미 계정이 있으신가요?
            </p>
            <Link href="/login" className="mt-2 inline-block text-emerald-300 hover:text-emerald-200 transition-colors font-medium">
              로그인하기
            </Link>
          </div>
        </motion.div>
      </div>
      
      <footer className="bg-emerald-900/30 py-6 border-t border-emerald-800/60">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-emerald-300/60">
            &copy; {new Date().getFullYear()} OK-Test. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage; 