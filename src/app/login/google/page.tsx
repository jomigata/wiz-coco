'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
import { primeFirebaseAuthSessionCache } from '@/hooks/useFirebaseAuth';
import { replaceWithAuthSession } from '@/utils/authSessionLifecycle';

/** Google OAuth redirect 시작·복귀 전용 (로그인 페이지와 분리) */
export default function GoogleLoginRedirectPage() {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
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

      const returnPath =
        sessionStorage.getItem('oauth_return') ||
        localStorage.getItem('oauth_return') ||
        '/';

      const started = await AccountIntegrationManager.startGoogleOAuth(returnPath);
      if (!started.ok) {
        setError(started.error || 'Google 로그인을 시작할 수 없습니다.');
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
          <p className="text-emerald-300">Google 로그인으로 이동 중입니다…</p>
        </div>
      )}
    </div>
  );
}
