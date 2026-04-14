'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { AccountIntegrationManager } from '@/utils/accountIntegration';

function NaverCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('네이버 로그인 처리 중…');
  const [failed, setFailed] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
      setFailed(true);
      setMessage(
        errorDescription
          ? decodeURIComponent(errorDescription)
          : '네이버 인증이 취소되었거나 거절되었습니다.'
      );
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) {
      setFailed(true);
      setMessage('인증 정보가 올바르지 않습니다.');
      return;
    }

    const redirectUri = `${window.location.origin}/login/naver-callback/`;

    (async () => {
      const result = await AccountIntegrationManager.completeOAuthFromCallback({
        provider: 'naver',
        code,
        state,
        redirectUri,
      });
      if (!result.success) {
        setFailed(true);
        setMessage(result.error || '로그인에 실패했습니다.');
        return;
      }
      const ret = sessionStorage.getItem('oauth_return') || '/mypage';
      sessionStorage.removeItem('oauth_return');
      sessionStorage.removeItem('oauth_provider');
      router.replace(ret);
    })();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full rounded-xl border border-emerald-800/40 bg-emerald-900/25 p-6 text-center">
          <p className={`text-sm ${failed ? 'text-red-300' : 'text-emerald-200'}`}>{message}</p>
          {failed && (
            <Link
              href="/login/"
              className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              로그인으로 돌아가기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NaverCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-emerald-950 flex flex-col">
          <Navigation />
          <div className="flex-grow flex items-center justify-center text-emerald-300 text-sm">
            로딩 중…
          </div>
        </div>
      }
    >
      <NaverCallbackInner />
    </Suspense>
  );
}
