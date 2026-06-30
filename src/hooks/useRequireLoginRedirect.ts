'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { buildLoginRedirectUrl, isLoginRequiredError } from '@/lib/authRedirect';
import { replaceWithAuthSession } from '@/utils/authSessionLifecycle';

/** Firebase 로그인이 없으면 로그인 페이지로 자동 이동 */
export function useRequireLoginRedirect(enabled = true): void {
  const router = useRouter();
  const { authPending, showLoginRequired } = useAuthResolved();

  useEffect(() => {
    if (!enabled || authPending || !showLoginRequired) return;
    replaceWithAuthSession(router, buildLoginRedirectUrl());
  }, [enabled, authPending, showLoginRequired, router]);
}

/** API/폼 오류 메시지가 인증 필요면 로그인 페이지로 이동 */
export function useRedirectOnLoginRequiredError(error: string, enabled = true): void {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !error) return;
    if (!isLoginRequiredError(error)) return;
    replaceWithAuthSession(router, buildLoginRedirectUrl());
  }, [enabled, error, router]);
}
