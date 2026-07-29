'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import CounselorAuthPageShell, {
  CounselorAuthLoading,
  counselorAuthButtonClass,
  counselorAuthCardClass,
  counselorAuthInputClass,
  counselorAuthLinkClass,
} from '@/components/auth/CounselorAuthPageShell';

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
    return <CounselorAuthLoading message="재설정 링크 확인 중…" />;
  }

  return (
    <CounselorAuthPageShell>
      <div className={`${counselorAuthCardClass} max-w-md`}>
        <h2 className="text-2xl font-semibold text-white text-center">새 비밀번호 설정</h2>

        {submitStatus === 'success' ? (
          <div className="text-center text-sm text-sky-200">
            비밀번호가 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.
          </div>
        ) : isValidCode ? (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              className={counselorAuthInputClass}
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호 확인"
              className={counselorAuthInputClass}
              required
              minLength={6}
            />
            {errorMessage ? (
              <p className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2">
                {errorMessage}
              </p>
            ) : null}
            <button type="submit" disabled={isSubmitting} className={counselorAuthButtonClass}>
              {isSubmitting ? '처리 중…' : '비밀번호 변경'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-red-300/95 text-sm">{errorMessage}</p>
            <Link href="/forgot-password" className={counselorAuthLinkClass}>
              비밀번호 찾기 다시 하기
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link href="/login" className={`text-sm ${counselorAuthLinkClass}`}>
            전문가·상담사 로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </CounselorAuthPageShell>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CounselorAuthLoading message="불러오는 중…" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
