'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

function ProgressPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired } = useAuthResolved();
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    const id = (searchParams.get('assessmentId') || '').trim();
    setAssessmentId(id);
    if (!id) {
      router.replace('/counselor/assessments');
    }
  }, [searchParams, router]);

  if (authPending) {
    return <AuthLoadingState className="py-8" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
    );
  }

  if (!assessmentId) {
    return <AuthLoadingState className="py-8" message="이동 중…" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AuthLink href="/counselor/assessments" className="text-sm text-sky-300/70 hover:text-sky-200">
        ← 검사코드 목록
      </AuthLink>
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

export default function ProgressDashboardPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 py-4 text-sm">불러오는 중…</div>}>
      <ProgressPageContent />
    </Suspense>
  );
}
