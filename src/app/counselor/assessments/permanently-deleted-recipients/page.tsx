'use client';

import React, { Suspense } from 'react';
import CounselorClientList from '@/components/counselor/CounselorClientList';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';

function PermanentlyDeletedRecipientsPageContent() {
  const adminUser = isAdmin(getAppRoleSync());

  if (!adminUser) {
    return (
      <AuthRequiredState
        autoRedirect={false}
        title="관리자 권한이 필요합니다"
        description="관리자 계정으로 로그인해야 영구삭제 내담자 목록을 이용할 수 있습니다."
      />
    );
  }

  return <CounselorClientList permanentlyDeletedMode />;
}

export default function PermanentlyDeletedRecipientsPage() {
  return (
    <Suspense fallback={<AuthLoadingState className="py-8" message="목록을 로딩중…" />}>
      <PermanentlyDeletedRecipientsPageContent />
    </Suspense>
  );
}
