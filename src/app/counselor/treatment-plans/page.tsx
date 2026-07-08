'use client';

import CounselorTreatmentPlansPanel from '@/components/counselor/CounselorTreatmentPlansPanel';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function TreatmentPlansPage() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 치료 계획을 이용할 수 있습니다." />
    );
  }

  return <CounselorTreatmentPlansPanel />;
}
