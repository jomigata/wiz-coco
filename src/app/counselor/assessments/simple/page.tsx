'use client';

import React from 'react';
import SeniorAssessmentListSimple from '@/components/counselor/senior/SeniorAssessmentListSimple';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useCounselorAssessmentsPage } from '@/hooks/useCounselorAssessmentsPage';

export default function AssessmentsSimplePage() {
  const { assessments, showInitialLoader, showAuthGate, revalidating, error } =
    useCounselorAssessmentsPage();

  if (showInitialLoader) return <AuthLoadingState />;
  if (showAuthGate) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
    );
  }
  if (error && assessments.length === 0) {
    return <p className="p-4 text-red-300">{error}</p>;
  }

  return <SeniorAssessmentListSimple assessments={assessments} revalidating={revalidating} />;
}
