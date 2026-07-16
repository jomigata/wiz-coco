'use client';

import React, { Suspense, useEffect, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorMonitoringHub from '@/components/counselor/CounselorMonitoringHub';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

function ProgressPageContent() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAssessmentId((params.get('assessmentId') || '').trim());
    } catch {
      setAssessmentId('');
    }
  }, []);

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
            ← 통합 모니터링
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
      <CounselorPageSection
        className="flex min-h-0 flex-1"
        title="검사코드별 진행"
        description="검사코드 단위로 발송·완료 현황을 확인하고 상세 진행현황으로 이동할 수 있습니다."
      >
        <CounselorMonitoringHub />
      </CounselorPageSection>
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
