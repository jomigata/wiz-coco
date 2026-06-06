'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseAuth, primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { markInternalNavigation, hasAuthenticatedTabSession } from '@/utils/authSessionLifecycle';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AccountIntegrationManager } from '@/utils/accountIntegration';

const LoadingLogin = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <div className="h-20" />
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-emerald-300 text-lg">로그인 페이지를 로딩 중입니다...</p>
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
  const redirectUrl = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(registered);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    if (emailVerification === 'sent') {
      setEmailVerificationMessage('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.');
    } else if (emailVerification === 'failed') {
      setEmailVerificationMessage('회원가입은 완료되었지만 인증 이메일 발송에 실패했습니다.');
    }
  }, [emailVerification]);

  useEffect(() => {
    if (!loading && user && hasAuthenticatedTabSession()) {
      markInternalNavigation();
      router.replace(redirectUrl);
    }
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

    try {
      const result = await AccountIntegrationManager.unifiedSignIn(email, password);

      if (result.success && result.user) {
        primeFirebaseAuthSessionCache(result.user);
        markInternalNavigation();
        router.replace(redirectUrl);
      } else {
        setLoginError(result.error || '로그인 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setLoginError('비밀번호 재설정을 위해 먼저 이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setLoginError('');
      await sendPasswordResetEmail(auth, email.trim());
      setPasswordResetSent(true);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/user-not-found') {
        setLoginError('등록되지 않은 이메일 주소입니다.');
      } else if (code === 'auth/invalid-email') {
        setLoginError('올바르지 않은 이메일 형식입니다.');
      } else if (code === 'auth/too-many-requests') {
        setLoginError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setLoginError('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-5 bg-emerald-900/25 p-6 rounded-xl border border-emerald-800/40">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-100 mb-1">로그인</h2>
            <p className="text-sm text-emerald-500/90">이메일과 비밀번호로 로그인</p>
          </div>

          {registrationSuccess && !emailVerificationMessage && (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center text-sm">
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

          {passwordResetSent && (
            <div className="bg-green-800/50 text-green-200 border border-green-600/50 p-4 rounded-lg text-center text-sm">
              {email}로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해주세요.
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
              className="w-full px-3 py-2.5 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
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
              className="w-full px-3 py-2.5 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
              placeholder="비밀번호"
            />
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-medium rounded-md text-emerald-50 bg-emerald-700/80 border border-emerald-600/40 hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? '처리 중…' : '로그인'}
            </button>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoading || passwordResetSent}
                className="text-xs text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
              >
                {passwordResetSent ? '재설정 메일 발송됨' : '비밀번호 찾기'}
              </button>
            </div>
          </form>

          <div className="text-center pt-1">
            <p className="text-xs text-emerald-600">
              <Link
                href="/register"
                className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
              >
                회원가입
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

const LoginPage: React.FC = () => (
  <Suspense fallback={<LoadingLogin />}>
    <LoginContent />
  </Suspense>
);

export default LoginPage;
