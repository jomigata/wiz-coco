'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { isGoogleOAuthPending, replaceWithAuthSession } from '@/utils/authSessionLifecycle';

/** Firebase Google redirect 로그인 시작·복귀 전용 */
export default function GoogleLoginRedirectPage() {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState('');
  const [statusHint, setStatusHint] = useState('Google 로그인으로 이동 중입니다…');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      if (isGoogleOAuthPending()) {
        const completed = await AccountIntegrationManager.completeGoogleRedirectSignIn();
        if (completed.success) {
          if (completed.user) {
            primeFirebaseAuthSessionCache(completed.user);
          }
          replaceWithAuthSession(router, completed.redirect || '/');
          return;
        }
        if (completed.error) {
          setError(completed.error);
          return;
        }
      }

      const returnPath =
        sessionStorage.getItem('oauth_return') ||
        localStorage.getItem('oauth_return') ||
        '/';

      setStatusHint('Google 계정 선택 화면으로 이동합니다…');
      const started = await AccountIntegrationManager.startGoogleOAuth(returnPath);
      if (!started.ok) {
        setError(started.error || 'Google 로그인을 시작할 수 없습니다.');
        return;
      }

      if (started.viaPopup && started.user) {
        primeFirebaseAuthSessionCache(started.user);
        replaceWithAuthSession(router, started.redirect || returnPath);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col items-center justify-center px-4">
      {error ? (
        <div className="max-w-sm w-full space-y-4 text-center">
          <p className="text-red-300 text-sm">{error}</p>
          <Link
            href="/login/"
            className="inline-block text-emerald-300 hover:text-emerald-200 underline text-sm"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-300">{statusHint}</p>
          <p className="text-emerald-600/80 text-xs mt-3">
            잠시 후에도 이동하지 않으면 팝업 창에서 계정을 선택해 주세요.
          </p>
        </div>
      )}
    </div>
  );
}
