'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const LoadingResetPassword = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <div className="h-20" />
    <div className="flex-grow flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (mode !== 'resetPassword' || !oobCode) {
        setIsValidCode(false);
        setErrorMessage('유효하지 않은 재설정 링크입니다. 비밀번호 찾기에서 다시 요청해주세요.');
        return;
      }
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch {
        setIsValidCode(false);
        setErrorMessage('만료되었거나 유효하지 않은 재설정 링크입니다.');
      }
    };
    void validate();
  }, [mode, oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

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
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSubmitStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setErrorMessage('비밀번호 재설정에 실패했습니다. 링크가 만료되었을 수 있습니다.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidCode === null) {
    return <LoadingResetPassword />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 bg-emerald-900/30 p-8 rounded-2xl border border-emerald-800/50">
          <h2 className="text-2xl font-bold text-emerald-200 text-center">새 비밀번호 설정</h2>

          {submitStatus === 'success' ? (
            <div className="text-center text-emerald-200 text-sm">
              비밀번호가 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.
            </div>
          ) : isValidCode ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                className="w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-xl"
                required
                minLength={6}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
                className="w-full px-4 py-3 border border-emerald-700/50 bg-emerald-900/30 text-emerald-200 rounded-xl"
                required
                minLength={6}
              />
              {errorMessage && (
                <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium disabled:opacity-60"
              >
                {isSubmitting ? '처리 중...' : '비밀번호 변경'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-red-400 text-sm">{errorMessage}</p>
              <Link href="/forgot-password" className="text-emerald-300 hover:text-emerald-200">
                비밀번호 찾기 다시 하기
              </Link>
            </div>
          )}

          <div className="text-center">
            <Link href="/login" className="text-sm text-emerald-400 hover:text-emerald-300">
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingResetPassword />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
