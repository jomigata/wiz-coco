'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { buildLoginRedirectUrl, isLoginRequiredError } from '@/lib/authRedirect';
import {
  isAuthLoginInProgress,
  replaceWithAuthSession,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';

/** Firebase 로그인이 없으면 로그인 페이지로 자동 이동 */
export function useRequireLoginRedirect(enabled = true): void {
  const router = useRouter();
  const { authPending, showLoginRequired } = useAuthResolved();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || authPending || !showLoginRequired) return;
    if (redirectedRef.current) return;

    const timer = window.setTimeout(() => {
      if (isAuthLoginInProgress()) return;
      tryRestoreAuthenticatedTabSession();
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      replaceWithAuthSession(router, buildLoginRedirectUrl());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [enabled, authPending, showLoginRequired, router]);
}

/** API/폼 오류 메시지가 인증 필요면 — 실제 미로그인일 때만 로그인 페이지로 이동 */
export function useRedirectOnLoginRequiredError(error: string, enabled = true): void {
  const router = useRouter();
  const { authPending, showLoginRequired } = useAuthResolved();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || authPending || !showLoginRequired || !error) return;
    if (!isLoginRequiredError(error)) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    replaceWithAuthSession(router, buildLoginRedirectUrl());
  }, [enabled, authPending, showLoginRequired, error, router]);
}
