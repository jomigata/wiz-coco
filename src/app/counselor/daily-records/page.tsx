'use client';

import CounselorDailyRecordsPanel from '@/components/counselor/CounselorDailyRecordsPanel';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function CounselorDailyRecordsPage() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 일상 기록을 관리할 수 있습니다." />
    );
  }

  return (
    <div className="space-y-6">
      <CounselorDailyRecordsPanel />
    </div>
  );
}
