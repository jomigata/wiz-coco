"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

// 로딩 컴포넌트
const LoadingResetPassword = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <Navigation />
    <div className="h-20"></div>
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-300 text-lg">비밀번호 재설정 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

// 클라이언트 컴포넌트
const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // 토큰 유효성 검사
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setErrorMessage('유효하지 않은 재설정 링크입니다.');
        return;
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setIsValidToken(true);
        } else {
          const data = await response.json();
          setIsValidToken(false);
          setErrorMessage(data.error || '만료되었거나 유효하지 않은 재설정 링크입니다.');
        }
      } catch (error) {
        console.error('토큰 검증 오류:', error);
        setIsValidToken(false);
        setErrorMessage('토큰 검증 중 오류가 발생했습니다.');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setErrorMessage('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      console.log('[Reset Password] 비밀번호 재설정 시작');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });
      
      const data = await response.json();
      console.log('[Reset Password] 서버 응답:', { status: response.status, data });
      
      if (response.ok) {
        console.log('[Reset Password] 비밀번호 재설정 성공');
        setSubmitStatus('success');
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        console.log('[Reset Password] 비밀번호 재설정 실패:', data.error);
        setErrorMessage(data.error || '비밀번호 재설정에 실패했습니다.');
        setSubmitStatus('error');
      }
    } catch (error: any) {
      console.error('[Reset Password] 비밀번호 재설정 오류:', error);
      setErrorMessage('비밀번호 재설정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidToken === null) {
    return <LoadingResetPassword />;
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
        <Navigation />
        <div className="h-20"></div>
        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8 bg-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-red-400 mb-2">링크가 유효하지 않습니다</h2>
              <p className="text-emerald-400 mb-4">{errorMessage}</p>
              <div className="space-y-2">
                <Link href="/forgot-password" className="block text-emerald-300 hover:text-emerald-200 font-medium transition-colors">
                  새로운 재설정 링크 요청
                </Link>
                <Link href="/login" className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="h-20"></div>
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-200 mb-2">새 비밀번호 설정</h2>
            <p className="text-emerald-400">심리케어 계정의 새로운 비밀번호를 설정하세요.</p>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center mb-4">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium mb-2">비밀번호가 성공적으로 변경되었습니다!</p>
              <p className="text-sm">새로운 비밀번호로 로그인하실 수 있습니다.</p>
              <p className="text-emerald-400 text-xs mt-3">3초 후 로그인 페이지로 이동합니다...</p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="newPassword" className="sr-only">새 비밀번호</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="새 비밀번호 (6자 이상)"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">비밀번호 확인</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="비밀번호 확인"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {errorMessage}
                </div>
              )}

              <div>
                <motion.button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      처리 중...
                    </div>
                  ) : (
                    "비밀번호 변경"
                  )}
                </motion.button>
              </div>
            </form>
          )}

          <div className="text-center space-y-4">
            <p className="text-emerald-400">
              비밀번호가 기억나셨나요?
            </p>
            <Link href="/login" className="block text-emerald-300 hover:text-emerald-200 font-medium transition-colors">
              로그인하기
            </Link>
          </div>
        </div>
      </div>
      
      <footer className="bg-emerald-900/30 py-6 border-t border-emerald-800/60">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-emerald-300/60">
            &copy; {new Date().getFullYear()} 심리케어. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// 메인 페이지 컴포넌트
const ResetPasswordPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingResetPassword />}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordPage; 