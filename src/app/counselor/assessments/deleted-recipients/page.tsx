'use client';

import React, { Suspense } from 'react';
import CounselorClientList from '@/components/counselor/CounselorClientList';
import { AuthLoadingState } from '@/components/auth/AuthStatusViews';

function DeletedRecipientsPageContent() {
  return <CounselorClientList deletedMode />;
}

export default function DeletedRecipientsPage() {
  return (
    <Suspense fallback={<AuthLoadingState className="py-8" message="목록을 로딩중…" />}>
      <DeletedRecipientsPageContent />
    </Suspense>
  );
}
