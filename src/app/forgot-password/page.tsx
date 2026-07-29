'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setTempData, getTempData } from '@/utils/localStorageManager';
import CounselorAuthPageShell, {
  counselorAuthButtonClass,
  counselorAuthCardClass,
  counselorAuthInputClass,
  counselorAuthLinkClass,
} from '@/components/auth/CounselorAuthPageShell';

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
    <CounselorAuthPageShell>
      <div className={`${counselorAuthCardClass} max-w-md`}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-1">비밀번호 재설정</h2>
          <p className="text-sm text-slate-400">가입하신 이메일로 재설정 링크를 보내드립니다.</p>
        </div>

        {submitStatus === 'success' ? (
          <div className="rounded-lg border border-sky-600/30 bg-sky-900/40 p-4 text-center text-sm text-sky-200">
            <p className="font-medium mb-2">이메일이 발송되었습니다!</p>
            <p>비밀번호 재설정 링크가 이메일로 전송되었습니다.</p>
            <p className="text-sky-400/80 text-xs mt-3">5초 후 로그인 페이지로 이동합니다…</p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={counselorAuthInputClass}
              placeholder="가입하신 이메일 주소"
              disabled={isSubmitting}
            />

            {errorMessage ? (
              <div className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2">
                {errorMessage}
              </div>
            ) : null}

            <button type="submit" className={counselorAuthButtonClass} disabled={isSubmitting}>
              {isSubmitting ? '처리 중…' : '비밀번호 재설정 링크 받기'}
            </button>
          </form>
        )}

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            <Link href="/login" className={counselorAuthLinkClass}>
              전문가·상담사 로그인
            </Link>
            <span className="mx-2 text-slate-600">·</span>
            <Link href="/register" className={counselorAuthLinkClass}>
              전문가·상담사 등록
            </Link>
          </p>
        </div>
      </div>
    </CounselorAuthPageShell>
  );
}
