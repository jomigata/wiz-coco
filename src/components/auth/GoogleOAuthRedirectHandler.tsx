'use client';

import { useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import {
  clearGoogleOAuthPending,
  endAuthLoginAttempt,
  isGoogleOAuthFlowActive,
  markAuthenticatedTabSession,
  replaceWithAuthSession,
} from '@/utils/authSessionLifecycle';
import { initializeFirebase } from '@/lib/firebase';

/** Firebase Google redirect 로그인 복귀 처리 (paint 전 실행, localStorage pending 체크) */
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

    void AccountIntegrationManager.completeGoogleRedirectSignIn().then(async (result) => {
      if (result.success) {
        onProcessingChange?.(false);
        if (result.user) primeFirebaseAuthSessionCache(result.user);
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        replaceWithAuthSession(router, result.redirect || defaultRedirect);
        return;
      }

      // getRedirectResult가 null을 반환했지만 auth.currentUser가 있는 경우
      // (Firebase SDK가 handler에서 이미 로그인 처리를 완료한 상황)
      try {
        const { auth: firebaseAuth } = initializeFirebase();
        await firebaseAuth?.authStateReady();
        const currentUser = firebaseAuth?.currentUser;
        if (currentUser) {
          console.log('[GoogleOAuthRedirectHandler] currentUser로 로그인 완료:', currentUser.email);
          markAuthenticatedTabSession();
          endAuthLoginAttempt();
          clearGoogleOAuthPending();
          primeFirebaseAuthSessionCache(currentUser);
          const redirect =
            sessionStorage.getItem('oauth_return') ||
            localStorage.getItem('oauth_return') ||
            defaultRedirect;
          sessionStorage.removeItem('oauth_return');
          localStorage.removeItem('oauth_return');
          onProcessingChange?.(false);
          replaceWithAuthSession(router, redirect);
          return;
        }
      } catch { /* ignore */ }

      onProcessingChange?.(false);
      if (result.error) onError?.(result.error);
    });
  }, [router, defaultRedirect, onError, onProcessingChange]);

  return null;
}
