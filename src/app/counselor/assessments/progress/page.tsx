'use client';

import React, { Suspense, useEffect, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <AuthLink
            href="/counselor/assessments/progress"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← 통합 모니터링
          </AuthLink>
          <AuthLink href="/counselor/assessments" className="text-sm text-slate-500 hover:text-slate-300">
            검사코드 목록
          </AuthLink>
          <h1 className="text-xl font-bold text-white">검사코드 발송·진행 현황</h1>
        </div>
        <AssessmentDispatchPanel assessmentId={assessmentId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <AuthLink href="/counselor/assessments" className="text-sm text-slate-400 hover:text-white">
          ← 검사코드 목록
        </AuthLink>
        <h1 className="text-xl font-bold text-white">통합 모니터링 허브</h1>
      </div>
      <CounselorMonitoringHub />
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
