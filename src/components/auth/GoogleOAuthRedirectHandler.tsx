'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import {
  isFirebaseAuthRedirectReturn,
  isGoogleOAuthPending,
  replaceWithAuthSession,
} from '@/utils/authSessionLifecycle';

/** Firebase Google redirect 로그인 복귀 처리 (login/register 공통, 팝업 없음) */
export default function GoogleOAuthRedirectHandler({
  defaultRedirect = '/',
  onError,
  onProcessingChange,
}: {
  defaultRedirect?: string;
  onError?: (message: string) => void;
  onProcessingChange?: (processing: boolean) => void;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (typeof window === 'undefined') return;
    if (!isGoogleOAuthPending() && !isFirebaseAuthRedirectReturn()) return;

    ran.current = true;
    onProcessingChange?.(true);

    void AccountIntegrationManager.completeGoogleRedirectSignIn().then((result) => {
      onProcessingChange?.(false);

      if (!result.success) {
        if (result.error) onError?.(result.error);
        return;
      }

      if (result.user) {
        primeFirebaseAuthSessionCache(result.user);
      }
      replaceWithAuthSession(router, result.redirect || defaultRedirect);
    });
  }, [router, defaultRedirect, onError, onProcessingChange]);

  return null;
}
