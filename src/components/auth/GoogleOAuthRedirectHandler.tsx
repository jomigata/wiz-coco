'use client';

import { useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { isGoogleOAuthFlowActive, replaceWithAuthSession } from '@/utils/authSessionLifecycle';

/** Firebase Google redirect 로그인 복귀 처리 (login/register — paint 전 실행) */
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

  useLayoutEffect(() => {
    if (ran.current) return;
    if (typeof window === 'undefined') return;
    if (!isGoogleOAuthFlowActive()) return;

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
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      replaceWithAuthSession(router, result.redirect || defaultRedirect);
    });
  }, [router, defaultRedirect, onError, onProcessingChange]);

  return null;
}
