'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';

type Props = {
  children: ReactNode;
  /** 비로그인 시 표시 */
  loginFallback?: ReactNode;
  /** 로그인했으나 승인 전 표시 (없으면 null) */
  unapprovedFallback?: ReactNode;
};

export function CounselorProfessionalUnapprovedPrompt() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center rounded-2xl border border-amber-500/20 bg-amber-950/20 p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-amber-200/80 mb-3">Professional Access</p>
        <h1 className="text-xl font-semibold text-white mb-3">상담사 승인 후 이용 가능합니다</h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          파트너·요금 안내와 Discover 구매 경로는 관리자 승인을 받은 전문가·상담사에게만 제공됩니다.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/counselor-application/"
            className="py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-colors"
          >
            상담사 신청 현황 보기
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}

/** 승인된 상담사·관리자에게만 전문가 콘텐츠(파트너·Discover 구매·요금) 표시 */
export default function CounselorProfessionalAccessGate({
  children,
  loginFallback = null,
  unapprovedFallback = null,
}: Props) {
  const { authPending, isAuthenticated } = useAuthResolved();
  const { loading, isApprovedCounselor } = useCounselorProfessionalAccess();

  if (authPending || (isAuthenticated && loading)) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{loginFallback}</>;
  }

  if (!isApprovedCounselor) {
    return <>{unapprovedFallback}</>;
  }

  return <>{children}</>;
}
