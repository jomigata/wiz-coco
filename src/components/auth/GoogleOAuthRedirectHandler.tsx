'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
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
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        replaceWithAuthSession(router, result.redirect || defaultRedirect);
        return;
      }

      // completeGoogleRedirectSignIn의 3차 onAuthStateChanged 대기까지 실패한 경우
      // — 마지막으로 Firebase currentUser 체크
      try {
        const { auth: firebaseAuth } = initializeFirebase();
        if (firebaseAuth) {
          await firebaseAuth.authStateReady();
          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            console.log('[GoogleOAuthRedirectHandler] 최종 currentUser 확인:', currentUser.email);
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
        }
      } catch { /* ignore */ }

      onProcessingChange?.(false);
      if (result.error) onError?.(result.error);
    });
  }, [router, defaultRedirect, onError, onProcessingChange]);

  return null;
}
