'use client';

import React, { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth, primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { initializeFirebase } from '@/lib/firebase';
import {
  hasAuthenticatedTabSession,
  beginAuthLoginAttempt,
  endAuthLoginAttempt,
  isAuthLoginInProgress,
  replaceWithAuthSession,
  markCounselorLoginPageSession,
} from '@/utils/authSessionLifecycle';
import { resolveCounselorPostLoginRedirect } from '@/lib/authRedirect';
import { clearClientPortalSessionWithBroadcast } from '@/lib/clientPortalSession';
import { AccountIntegrationManager } from '@/utils/accountIntegration';

const LoadingLogin = () => (
  <div className="min-h-screen bg-[#060a12] flex flex-col">
    <div className="h-20" />
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sky-300 text-lg">로그인 페이지를 로딩중…</p>
      </div>
    </div>
  </div>
);

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useFirebaseAuth();
  const registered = searchParams.get('registered') === 'true';
  const emailVerification = searchParams.get('emailVerification');
  const redirectUrl = resolveCounselorPostLoginRedirect(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(registered);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    markCounselorLoginPageSession();
  }, []);

  useEffect(() => {
    if (emailVerification === 'sent') {
      setEmailVerificationMessage('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.');
    } else if (emailVerification === 'failed') {
      setEmailVerificationMessage('회원가입은 완료되었지만 인증 이메일 발송에 실패했습니다.');
    }
  }, [emailVerification]);

  useEffect(() => {
    if (loading || !user) return;
    if (!hasAuthenticatedTabSession() && !isAuthLoginInProgress()) return;
    const { auth } = initializeFirebase();
    const current = auth?.currentUser;
    if (!current || current.uid !== user.uid) return;
    replaceWithAuthSession(router, redirectUrl);
  }, [user, loading, router, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setLoginError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setLoginError('');
    beginAuthLoginAttempt();

    try {
      const result = await AccountIntegrationManager.unifiedSignIn(email, password);

      if (result.success && result.user) {
        clearClientPortalSessionWithBroadcast();
        primeFirebaseAuthSessionCache(result.user);
        const { auth } = initializeFirebase();
        try {
          await auth?.authStateReady?.();
        } catch {
          // ignore
        }
        replaceWithAuthSession(router, redirectUrl);
        window.setTimeout(() => endAuthLoginAttempt(), 5000);
      } else {
        endAuthLoginAttempt();
        setLoginError(result.error || '로그인 처리 중 오류가 발생했습니다.');
      }
    } catch {
      endAuthLoginAttempt();
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060a12] flex flex-col">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="login-grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#login-grid)" />
        </svg>
      </div>
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-5 bg-[#182438]/90 p-6 rounded-xl border border-white/[0.14] shadow-xl shadow-black/30">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-1">전문가·상담사 로그인</h2>
            <p className="text-sm text-slate-400">상담(코드) 관리를 위한 전문가·상담사 계정</p>
          </div>

          {registrationSuccess && !emailVerificationMessage && (
            <div className="bg-sky-900/40 text-sky-200 p-4 rounded-lg text-center text-sm border border-sky-600/30">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          {emailVerificationMessage && (
            <div
              className={`p-4 rounded-lg text-center text-sm ${
                emailVerification === 'sent'
                  ? 'bg-blue-800/50 text-blue-200 border border-blue-600/50'
                  : 'bg-amber-800/50 text-amber-200 border border-amber-600/50'
              }`}
            >
              {emailVerificationMessage}
            </div>
          )}

          {loginError && (
            <div
              className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2"
              aria-live="assertive"
            >
              {loginError}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleLogin} autoComplete="off">
            <label htmlFor="email" className="sr-only">
              이메일
            </label>
            <input
              id="email"
              name="wizcoco-login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-white/15 bg-[#121f38]/95 placeholder-slate-500 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/60"
              placeholder="이메일"
            />
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="wizcoco-login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-white/15 bg-[#121f38]/95 placeholder-slate-500 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/60"
              placeholder="비밀번호"
            />
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-medium rounded-md text-white bg-sky-600 border border-sky-500/40 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? '처리 중…' : '로그인'}
            </button>
          </form>

          <div className="text-center pt-1">
            <p className="text-xs text-slate-500">
              <Link
                href="/register"
                className="text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline"
              >
                전문가·상담사 등록
              </Link>
              <span className="mx-2 text-slate-600">·</span>
              <Link
                href="/forgot-password"
                className="text-sky-400/80 hover:text-sky-300 underline-offset-2 hover:underline"
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

const LoginPage: React.FC = () => (
  <Suspense fallback={<LoadingLogin />}>
    <LoginContent />
  </Suspense>
);

export default LoginPage;
