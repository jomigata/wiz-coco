'use client';

import type { ReactNode } from 'react';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';
import { CounselorProfessionalUnapprovedPrompt } from '@/components/auth/CounselorProfessionalAccessGate';

type Props = {
  children: ReactNode;
};

/** 로그인한 미승인 회원은 Discover 구매·체크 경로 차단 (비로그인 공개 유지) */
export default function DiscoverLoggedInPurchaseGate({ children }: Props) {
  const { isAuthenticated, authPending } = useAuthResolved();
  const { loading, isApprovedCounselor } = useCounselorProfessionalAccess();

  if (authPending || (isAuthenticated && loading)) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        확인 중…
      </main>
    );
  }

  if (isAuthenticated && !isApprovedCounselor) {
    return <CounselorProfessionalUnapprovedPrompt />;
  }

  return <>{children}</>;
}
