'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

function JoinAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    const q = searchParams.toString();
    const target = q ? `${pathname}?${q}` : pathname;
    router.replace(`/login?redirect=${encodeURIComponent(target)}`);
  }, [user, loading, router, pathname, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div
          className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
          aria-hidden
        />
        <p className="text-sm">인증 확인 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div
          className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
          aria-hidden
        />
        <p className="text-sm">로그인 페이지로 이동합니다…</p>
      </div>
    );
  }

  return <>{children}</>;
}

function JoinAuthFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
      <div
        className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
        aria-hidden
      />
      <p className="text-sm">페이지를 불러오는 중…</p>
    </div>
  );
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<JoinAuthFallback />}>
      <JoinAuthGate>{children}</JoinAuthGate>
    </Suspense>
  );
}
