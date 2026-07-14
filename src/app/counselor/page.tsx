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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">상담사 대시보드</h1>
          <p className="text-gray-300 text-lg">
            개별·그룹 검사 진행 현황과 담당 기관을 한곳에서 확인하세요
          </p>
        </div>
        <CounselorHomeDashboard />
      </div>
    </div>
  );
}
