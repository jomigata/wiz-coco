'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { initializeFirebase } from '@/lib/firebase';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { markInternalNavigation } from '@/utils/authSessionLifecycle';
import { resolveOAuthRedirectUri } from '@/utils/oauthRedirectOrigin';
import {
  isOAuthCodeAlreadyConsumed,
  stripOAuthParamsFromUrl,
} from '@/utils/oauthCallbackGuard';

function GoogleCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
      setErrorMessage(
        errorDescription
          ? decodeURIComponent(errorDescription)
          : '구글 인증이 취소되었거나 거절되었습니다.',
      );
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code) {
      setErrorMessage('인증 코드가 없습니다.');
      return;
    }

    if (isOAuthCodeAlreadyConsumed(code)) {
      setErrorMessage(
        '이미 처리된 로그인입니다. 로그인 페이지에서 Google 로그인을 다시 시도해 주세요.',
      );
      stripOAuthParamsFromUrl();
      return;
    }

    stripOAuthParamsFromUrl();
    initializeFirebase();

    const redirectUri = resolveOAuthRedirectUri(state, 'google');

    (async () => {
      const result = await AccountIntegrationManager.completeOAuthFromCallback({
        provider: 'google',
        code,
        state,
        redirectUri,
      });
      if (!result.success) {
        setErrorMessage(result.error || '로그인에 실패했습니다.');
        return;
      }
      const ret = sessionStorage.getItem('oauth_return') || '/mypage';
      sessionStorage.removeItem('oauth_return');
      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_redirect_uri');
      sessionStorage.removeItem('oauth_client_id');
      localStorage.removeItem('oauth_redirect_uri');
      localStorage.removeItem('oauth_client_id');
      const { auth: authed } = initializeFirebase();
      if (authed?.currentUser) {
        primeFirebaseAuthSessionCache(authed.currentUser);
      }
      markInternalNavigation();
      router.replace(ret);
    })();
  }, [router, searchParams]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-sm w-full rounded-xl border border-emerald-800/40 bg-emerald-900/25 p-6 text-center">
            <p className="text-sm text-red-300">{errorMessage}</p>
            <Link
              href="/login/"
              className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-emerald-950" aria-busy="true" />;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-emerald-950" />}
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
