'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache, useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { markInternalNavigation } from '@/utils/authSessionLifecycle';

const LoadingRegister = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <div className="h-20" />
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-emerald-300 text-lg">회원가입 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-5 bg-emerald-900/25 p-6 rounded-xl border border-emerald-800/40">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-100 mb-1">전문가·상담사 계정 만들기</h2>
            <p className="text-sm text-emerald-500/90 leading-relaxed">
              검사 코드 발급·내담자 관리용
              <br />
              전문가·상담사 계정을 생성합니다.
            </p>
          </div>

          {registerError && (
            <div
              className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2"
              aria-live="assertive"
            >
              {registerError}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleRegister}>
            <label htmlFor="name" className="sr-only">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              placeholder="이름"
            />
            <label htmlFor="email" className="sr-only">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              placeholder="이메일"
            />
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              placeholder="비밀번호 (6자 이상)"
            />

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-medium rounded-md text-emerald-50 bg-emerald-700/80 border border-emerald-600/40 hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? '처리 중…' : '가입하기'}
            </button>
          </form>

          <div className="text-center pt-1">
            <p className="text-xs text-emerald-600">
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
              >
                전문가·상담사 로그인
              </Link>
              <span className="mx-2 text-emerald-800">·</span>
              <Link
                href="/forgot-password"
                className="text-emerald-500 hover:text-emerald-400 underline-offset-2 hover:underline"
              >
                비밀번호 찾기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => (
  <Suspense fallback={<LoadingRegister />}>
    <RegisterContent />
  </Suspense>
);

export default RegisterPage;
