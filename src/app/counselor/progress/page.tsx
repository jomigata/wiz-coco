'use client';

import CounselorMonitoringHub from '@/components/counselor/CounselorMonitoringHub';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import AuthLink from '@/components/auth/AuthLink';

export default function ProgressPage() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 모니터링 허브를 이용할 수 있습니다." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AuthLink
          href="/counselor/progress?view=care"
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          치료·과제 모니터링 →
        </AuthLink>
        <AuthLink
          href="/counselor/assessments/progress"
          className="text-sm text-sky-400 hover:text-sky-300"
        >
          검사코드별 상세 현황 →
        </AuthLink>
      </div>
      <CounselorMonitoringHub />
    </div>
  );
}
