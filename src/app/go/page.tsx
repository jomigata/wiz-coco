'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPortalMagicToken } from '@/lib/clientPortalApi';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';
import { setPortalReturnPath } from '@/lib/portalReturnPath';

function GoLoading() {
  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">접속 링크를 확인하는 중…</p>
    </div>
  );
}

function GoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('유효하지 않은 링크입니다.');
      return;
    }
    let cancelled = false;
    (async () => {
      await resetAllSessionsBeforePortalLinkEntry();
      if (cancelled) return;
      try {
        const result = await verifyPortalMagicToken(token);
        if (cancelled) return;
        persistClientPortalSession(result);
        clearJoinGuestSession();
        clearJoinParticipantSession();
        const tab = (searchParams.get('tab') || '').trim();
        const dest = tab ? `/portal/?tab=${encodeURIComponent(tab)}` : '/portal/';
        setPortalReturnPath(dest);
        router.replace(dest);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '링크를 사용할 수 없습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1628] pt-24 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-white/[0.12] bg-[#182438] p-8 shadow-xl shadow-black/30 text-left">
          <h1 className="text-lg font-semibold text-amber-200 mb-3 text-center">
            링크를 사용할 수 없습니다
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            이메일로 받은 「바로 시작」 링크는 발송 후 72시간까지만 유효합니다. 기한이 지났거나
            이미 사용된 링크일 수 있습니다.
          </p>
          <div className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-3.5 mb-6">
            <p className="text-sky-100 font-semibold text-sm">
              나의코드 / 비밀번호 이용을 추천합니다
            </p>
            <p className="mt-1.5 text-slate-300 text-xs leading-relaxed">
              안내 이메일에 적힌 <span className="text-white font-medium">나의코드</span>와{' '}
              <span className="text-white font-medium">4자리 비밀번호</span>로 로그인하면 언제든
              검사를 이어갈 수 있습니다.
            </p>
          </div>
          {error && error !== '링크를 사용할 수 없습니다.' ? (
            <p className="text-slate-500 text-xs mb-4">{error}</p>
          ) : null}
          <div className="text-center">
            <Link
              href="/portal/login/"
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
            >
              나의코드로 직접 들어가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <GoLoading />;
}

export default function GoPage() {
  return (
    <Suspense fallback={<GoLoading />}>
      <GoContent />
    </Suspense>
  );
}
