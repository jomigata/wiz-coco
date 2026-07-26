'use client';

import React from 'react';
import SeniorAssessmentListContrast from '@/components/counselor/senior/SeniorAssessmentListContrast';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useCounselorAssessmentsPage } from '@/hooks/useCounselorAssessmentsPage';

export default function AssessmentsSeniorPage() {
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

  return <SeniorAssessmentListContrast assessments={assessments} revalidating={revalidating} />;
}
