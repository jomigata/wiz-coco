'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setTempData, getTempData } from '@/utils/localStorageManager';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (email) {
      setTempData('forgot-password-form', { email }, 30);
    }
  }, [email]);

  useEffect(() => {
    const savedForm = getTempData<{ email: string }>('forgot-password-form');
    if (savedForm?.email) {
      setEmail(savedForm.email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('이메일 주소를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSubmitStatus('success');
      setTempData('forgot-password-form', null, 0);
      setTimeout(() => router.push('/login'), 5000);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setErrorMessage('등록되지 않은 이메일 주소입니다.');
      } else if (code === 'auth/invalid-email') {
        setErrorMessage('올바르지 않은 이메일 형식입니다.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setErrorMessage('비밀번호 재설정 요청 처리 중 오류가 발생했습니다.');
      }
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <div className="h-20" />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-emerald-900/30 p-8 rounded-2xl backdrop-blur-sm border border-emerald-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-emerald-200 mb-2">비밀번호 재설정</h2>
            <p className="text-emerald-400">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
          </div>

          {submitStatus === 'success' ? (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center">
              <p className="font-medium mb-2">이메일이 발송되었습니다!</p>
              <p className="text-sm">비밀번호 재설정 링크가 이메일로 전송되었습니다.</p>
              <p className="text-emerald-400 text-xs mt-3">5초 후 로그인 페이지로 이동합니다...</p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 placeholder-emerald-500 text-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="가입하신 이메일 주소"
                disabled={isSubmitting}
              />

              {errorMessage && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {errorMessage}
                </div>
              )}

              <motion.button
                type="submit"
                className="w-full py-3 text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : '비밀번호 재설정 링크 받기'}
              </motion.button>
            </form>
          )}

          <div className="text-center space-y-2">
            <Link href="/login" className="block text-emerald-300 hover:text-emerald-200 font-medium">
              전문가·상담사 로그인
            </Link>
            <Link href="/register" className="block text-sm text-emerald-400 hover:text-emerald-300">
              전문가·상담사 회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
