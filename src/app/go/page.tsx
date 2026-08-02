'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPortalMagicToken, type PortalMagicVerifyError } from '@/lib/clientPortalApi';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { resetAllSessionsBeforePortalLinkEntry } from '@/lib/portalLinkEntryReset';
import { setPortalReturnPath } from '@/lib/portalReturnPath';

function formatExpiryLabel(unixSeconds?: number): string | null {
  if (!unixSeconds) return null;
  try {
    return new Date(unixSeconds * 1000).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return null;
  }
}

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
  const [expiresAt, setExpiresAt] = useState<number | undefined>();

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
        const magicErr = err as PortalMagicVerifyError;
        setError(err instanceof Error ? err.message : '링크를 사용할 수 없습니다.');
        if (typeof magicErr.expiresAt === 'number') {
          setExpiresAt(magicErr.expiresAt);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router, searchParams]);

  if (error) {
    const expiryLabel = formatExpiryLabel(expiresAt);
    return (
      <div className="min-h-screen bg-[#0f1628] pt-24 px-4">
        <div className="max-w-md mx-auto rounded-2xl border border-white/[0.12] bg-[#182438] p-8 shadow-xl shadow-black/30 text-left">
          <h1 className="text-lg font-semibold text-amber-200 mb-4 text-center">
            링크를 사용할 수 없습니다
          </h1>
          <div className="rounded-xl border border-amber-500/20 bg-[#1a1408]/80 px-4 py-3.5 mb-4">
            <p className="text-sm leading-relaxed text-slate-300">
              검사 바로시작 링크는 발송 후 72시간까지만 유효합니다.
              {expiryLabel ? (
                <>
                  {' '}
                  (<span className="text-amber-200/90">유효기한: {expiryLabel}까지</span>)
                </>
              ) : null}
            </p>
          </div>
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
