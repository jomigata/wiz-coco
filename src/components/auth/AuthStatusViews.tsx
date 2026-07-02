'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';
import {
  isAuthLoginInProgress,
  replaceWithAuthSession,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';

type AuthLoadingProps = {
  message?: string;
  className?: string;
};

export function AuthLoadingState({ message = '불러오는 중…', className = '' }: AuthLoadingProps) {
  return (
    <AuthLoadingInner className={className} message={message} />
  );
}

function AuthLoadingInner({ className, message }: AuthLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-12 ${className ?? ''}`.trim()}>
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

type AuthRequiredProps = {
  title?: string;
  description?: string;
  loginHref?: string;
  className?: string;
  /** true면 로그인 페이지로 자동 이동 (기본) */
  autoRedirect?: boolean;
};

export function AuthRequiredState({
  title = '로그인이 필요합니다',
  description = '로그인한 상태에서 다시 시도해 주세요.',
  loginHref = '/login',
  className = '',
  autoRedirect = true,
}: AuthRequiredProps) {
  const router = useRouter();

  useEffect(() => {
    if (!autoRedirect) return;
    if (isAuthLoginInProgress()) return;

    const timer = window.setTimeout(() => {
      if (isAuthLoginInProgress()) return;
      tryRestoreAuthenticatedTabSession();
      const target =
        loginHref === '/login' ? buildLoginRedirectUrl() : loginHref;
      replaceWithAuthSession(router, target);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [autoRedirect, loginHref, router]);

  if (autoRedirect) {
    return <AuthLoadingState message="로그인 페이지로 이동 중…" className={className} />;
  }

  return (
    <div className={`rounded-xl border border-amber-600/30 bg-amber-900/20 p-5 ${className}`.trim()}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
          <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-amber-200">{title}</p>
          <p className="mt-0.5 text-sm text-amber-400/70">{description}</p>
          <Link href={loginHref} className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

type AuthGateProps = {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  loginFallback?: React.ReactNode;
};

export function AuthGate({ children, loadingFallback, loginFallback }: AuthGateProps) {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <>{loadingFallback ?? <AuthLoadingState />}</>;
  }
  if (showLoginRequired) {
    return <>{loginFallback ?? <AuthRequiredState />}</>;
  }
  return <>{children}</>;
}
