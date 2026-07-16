'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorMonitoringHub, {
  type MonitoringHubView,
} from '@/components/counselor/CounselorMonitoringHub';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

function parseMonitoringView(raw: string | null): MonitoringHubView {
  if (raw === 'cohorts' || raw === 'care') return raw;
  return 'overview';
}

function ProgressPageContent() {
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired } = useAuthResolved();
  const [assessmentId, setAssessmentId] = useState('');

  const monitoringView = useMemo(
    () => parseMonitoringView(searchParams.get('view')),
    [searchParams],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAssessmentId((params.get('assessmentId') || '').trim());
    } catch {
      setAssessmentId('');
    }
  }, [searchParams]);

  if (authPending) {
    return <AuthLoadingState className="py-8" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
    );
  }

  if (assessmentId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <AuthLink href="/counselor/assessments/progress" className="text-sky-300/70 hover:text-sky-200">
            ← 검사코드별 진행
          </AuthLink>
          <AuthLink href="/counselor/assessments" className="text-slate-500 hover:text-slate-300">
            검사코드 목록
          </AuthLink>
        </div>
        <CounselorPageSection
          className="flex min-h-0 flex-1"
          bodyClassName="!p-0"
          noBodyPadding
          title="발송 및 검사 현황"
        >
          <div className="p-2.5 sm:p-3">
            <AssessmentDispatchPanel assessmentId={assessmentId} />
          </div>
        </CounselorPageSection>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AuthLink href="/counselor/assessments" className="text-sm text-sky-300/70 hover:text-sky-200">
        ← 검사코드 목록
      </AuthLink>
      <CounselorMonitoringHub initialView={monitoringView} />
    </div>
  );
}

export default function ProgressDashboardPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-4 text-sm">불러오는 중…</div>}>
      <ProgressPageContent />
    </Suspense>
  );
}
