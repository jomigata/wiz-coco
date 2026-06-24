'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyPortalMagicToken } from '@/lib/clientPortalApi';
import { persistClientPortalSession } from '@/lib/clientPortalSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
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
    verifyPortalMagicToken(token)
      .then((result) => {
        if (cancelled) return;
        persistClientPortalSession(result);
        clearJoinGuestSession();
        clearJoinParticipantSession();
        setPortalReturnPath('/portal/');
        router.replace('/portal/');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '링크를 사용할 수 없습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-4">
        <div className="max-w-md mx-auto text-center bg-slate-800/80 rounded-2xl border border-slate-600 p-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300 text-sm">
            검사 코드로 직접 들어가기
          </Link>
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
