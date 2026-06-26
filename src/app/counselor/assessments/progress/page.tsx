'use client';

import React, { useEffect, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function ProgressDashboardPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
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

  if (!assessmentId) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">잘못된 경로입니다.</p>
        <AuthLink href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          검사코드 목록으로
        </AuthLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <AuthLink href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
          ← 검사코드 목록
        </AuthLink>
        <h1 className="text-2xl font-bold text-white">진행현황</h1>
      </div>

      {authPending ? (
        <AuthLoadingState className="py-8" />
      ) : showLoginRequired ? (
        <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
      ) : (
        <AssessmentDispatchPanel assessmentId={assessmentId} />
      )}
    </div>
  );
}
