'use client';

import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorMonitoringHub from '@/components/counselor/CounselorMonitoringHub';
import NotificationChannelStatus from '@/components/counselor/NotificationChannelStatus';
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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <AuthLink
          href="/counselor/progress?view=care"
          className="text-violet-400 hover:text-violet-300"
        >
          치료·과제 모니터링 →
        </AuthLink>
        <AuthLink
          href="/counselor/assessments/progress"
          className="text-sky-400 hover:text-sky-300"
        >
          검사코드별 상세 현황 →
        </AuthLink>
      </div>
      <CounselorPageSection title="알림 채널 상태">
        <NotificationChannelStatus />
      </CounselorPageSection>
      <CounselorPageSection
        className="flex min-h-0 flex-1"
        title="통합 모니터링"
        description="모든 검사코드·그룹·치료 과제 진행을 한 화면에서 확인합니다."
      >
        <CounselorMonitoringHub />
      </CounselorPageSection>
    </div>
  );
}
