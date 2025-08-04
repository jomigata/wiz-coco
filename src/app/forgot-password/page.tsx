'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { setTempData, getTempData } from '@/utils/localStorageManager';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  // 폼 데이터 임시 저장 (사용자가 입력 중인 데이터 보호)
  useEffect(() => {
    if (email) {
      setTempData('forgot-password-form', { email }, 30); // 30분간 임시 저장
    }
  }, [email]);

  // 페이지 로드 시 임시 저장된 폼 데이터 복원
  useEffect(() => {
    const savedForm = getTempData<{ email: string }>('forgot-password-form');
    if (savedForm) {
      setEmail(savedForm.email || '');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('이메일 주소를 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      console.log('[Forgot Password] 비밀번호 재설정 요청 시작:', email);
      
      // 실제 API 호출
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      
      const data = await response.json();
      console.log('[Forgot Password] 서버 응답:', { status: response.status, data });
      
      if (response.ok) {
        console.log('[Forgot Password] 비밀번호 재설정 요청 성공');
        setSubmitStatus('success');
        
        // 임시 폼 데이터 삭제 (요청 완료)
        setTempData('forgot-password-form', null, 0);
        
        // 5초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } else {
        console.log('[Forgot Password] 비밀번호 재설정 요청 실패:', data.error);
        setErrorMessage(data.error || '비밀번호 재설정 요청에 실패했습니다.');
        setSubmitStatus('error');
      }
    } catch (error: any) {
      console.error('[Forgot Password] 비밀번호 재설정 요청 오류:', error);
      
      // 네트워크 오류 등의 경우 임시 저장
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('네트워크 연결을 확인해주세요. 입력하신 정보는 임시 저장되었습니다.');
        // 폼 데이터를 더 오래 보관 (네트워크 복구 시까지)
        setTempData('forgot-password-form-backup', { email }, 24 * 60); // 24시간
      } else {
        setErrorMessage('비밀번호 재설정 요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      {/* 상단 메뉴 */}
      <Navigation />
      
      {/* 네비게이션 높이만큼 여백 추가 */}
      <div className="h-20"></div>
      
      {/* 비밀번호 재설정 폼 */}
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-200 mb-2">비밀번호 재설정</h2>
            <p className="text-emerald-400">심리케어 계정의 비밀번호를 재설정하세요.</p>
            <p className="text-emerald-500 text-sm mt-2">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center mb-4">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium mb-2">이메일이 발송되었습니다!</p>
              <p className="text-sm">비밀번호 재설정 링크가 이메일로 전송되었습니다.</p>
              <p className="text-sm mt-1">이메일을 확인해주세요.</p>
              <p className="text-emerald-400 text-xs mt-3">5초 후 로그인 페이지로 이동합니다...</p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    placeholder="가입하신 이메일 주소를 입력하세요"
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
                    "비밀번호 재설정 링크 받기"
                  )}
                </motion.button>
              </div>
            </form>
          )}

          <div className="text-center space-y-4">
            <p className="text-emerald-400">
              비밀번호가 기억나셨나요?
            </p>
            <div className="space-y-2">
              <Link href="/login" className="block text-emerald-300 hover:text-emerald-200 font-medium transition-colors">
                로그인하기
              </Link>
              <Link href="/register" className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                계정이 없으신가요? 회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* 푸터 */}
      <footer className="bg-emerald-900/30 py-6 border-t border-emerald-800/60">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-emerald-300/60">
            &copy; {new Date().getFullYear()} 심리케어. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 