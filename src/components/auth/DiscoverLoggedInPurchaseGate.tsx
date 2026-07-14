'use client';

import type { ReactNode } from 'react';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';
import { CounselorProfessionalUnapprovedPrompt } from '@/components/auth/CounselorProfessionalAccessGate';
import CounselorSalesLoginPrompt from '@/components/auth/CounselorSalesLoginPrompt';

type Props = {
  children: ReactNode;
};

/** 승인된 상담사·관리자만 Discover·파트너 영업 도구 이용 가능 */
export default function DiscoverLoggedInPurchaseGate({ children }: Props) {
  const { isAuthenticated, authPending } = useAuthResolved();
  const { loading, isApprovedCounselor } = useCounselorProfessionalAccess();

  if (authPending || (isAuthenticated && loading)) {
    return (
      <main
        className={`min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm ${APP_HEADER_PT}`}
      >
        확인 중…
      </main>
    );
  }

  if (!isAuthenticated) {
    return <CounselorSalesLoginPrompt />;
  }

  if (!isApprovedCounselor) {
    return <CounselorProfessionalUnapprovedPrompt />;
  }

  return <>{children}</>;
}
