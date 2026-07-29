'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache, useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { markInternalNavigation } from '@/utils/authSessionLifecycle';
import CounselorAuthPageShell, {
  CounselorAuthLoading,
  counselorAuthButtonClass,
  counselorAuthCardClass,
  counselorAuthInputClass,
  counselorAuthLinkClass,
} from '@/components/auth/CounselorAuthPageShell';

const RegisterContent = () => {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      markInternalNavigation();
      router.replace('/mypage');
    }
  }, [user, loading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setRegisterError('이름을 입력해주세요.');
      return;
    }

    if (!email || !password) {
      setRegisterError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegisterError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setRegisterError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    setRegisterError('');

    try {
      const result = await AccountIntegrationManager.signUpWithEmail(email, password, name);

      if (!result.success || !result.user) {
        setRegisterError(result.error || '회원가입 처리 중 오류가 발생했습니다.');
        return;
      }

      primeFirebaseAuthSessionCache(result.user);
      router.push('/login?registered=true&emailVerification=sent');
    } catch {
      setRegisterError('회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CounselorAuthPageShell>
      <div className={counselorAuthCardClass}>
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-1">전문가·상담사 계정 등록</h2>
          <p className="text-sm text-slate-400">상담(코드) 관리를 위한 전문가·상담사 계정</p>
        </div>

        {registerError ? (
          <div
            className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2"
            aria-live="assertive"
          >
            {registerError}
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={handleRegister}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={counselorAuthInputClass}
            placeholder="이름"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={counselorAuthInputClass}
            placeholder="이메일"
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={counselorAuthInputClass}
            placeholder="비밀번호 (6자 이상)"
          />
          <button type="submit" className={counselorAuthButtonClass} disabled={isLoading}>
            {isLoading ? '처리 중…' : '등록하기'}
          </button>
        </form>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            <Link href="/login" className={counselorAuthLinkClass}>
              전문가·상담사 로그인
            </Link>
            <span className="mx-2 text-slate-600">·</span>
            <Link href="/forgot-password" className={counselorAuthLinkClass}>
              비밀번호 찾기
            </Link>
          </p>
        </div>
      </div>
    </CounselorAuthPageShell>
  );
};

const RegisterPage: React.FC = () => (
  <Suspense fallback={<CounselorAuthLoading message="회원가입 페이지를 로딩 중입니다..." />}>
    <RegisterContent />
  </Suspense>
);

export default RegisterPage;
