'use client';

import React from 'react';
import CounselorHomeDashboard from '@/components/counselor/CounselorHomeDashboard';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function CounselorDashboard() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 상담사 대시보드를 이용할 수 있습니다." />
    );
  }

  return <CounselorHomeDashboard />;
}
