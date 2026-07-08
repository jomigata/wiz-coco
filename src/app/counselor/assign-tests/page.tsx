'use client';

import CounselorAssignTestsPanel from '@/components/counselor/CounselorAssignTestsPanel';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function AssignTestsPage() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 검사 할당 관리를 이용할 수 있습니다." />
    );
  }

  return <CounselorAssignTestsPanel />;
}
