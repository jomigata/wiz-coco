'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AssessmentDispatchPanel from '@/components/counselor/AssessmentDispatchPanel';
import { rememberCounselorAssessmentContext, rememberCounselorProgressFrom, resolveCounselorProgressFrom } from '@/lib/counselorNestedNav';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { LoadingMessage } from '@/components/ui/LoadingMessage';

function ProgressPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authPending, showLoginRequired } = useAuthResolved();
  const [assessmentId, setAssessmentId] = useState(
    () => (searchParams.get('assessmentId') || '').trim(),
  );
  const [portalId, setPortalId] = useState(() => (searchParams.get('portalId') || '').trim());

  useEffect(() => {
    const id = (searchParams.get('assessmentId') || '').trim();
    const pid = (searchParams.get('portalId') || '').trim();
    setAssessmentId(id);
    setPortalId(pid);
    if (id) rememberCounselorAssessmentContext(id);
    const from = resolveCounselorProgressFrom(
      '/counselor/assessments/progress',
      searchParams.toString() ? `?${searchParams.toString()}` : '',
    );
    rememberCounselorProgressFrom(from);
    if (!id) {
      router.replace('/counselor/assessments');
      return;
    }
    if (from === 'clients') {
      const q = new URLSearchParams();
      if (pid) q.set('expandPortalId', pid);
      router.replace(q.size ? `/counselor/clients?${q.toString()}` : '/counselor/clients');
      return;
    }
    if (from === 'deleted-recipients') {
      const q = new URLSearchParams();
      if (pid) q.set('expandPortalId', pid);
      router.replace(
        q.size
          ? `/counselor/assessments/deleted-recipients?${q.toString()}`
          : '/counselor/assessments/deleted-recipients',
      );
    }
  }, [searchParams, router]);

  const entryFrom = resolveCounselorProgressFrom(
    '/counselor/assessments/progress',
    searchParams.toString() ? `?${searchParams.toString()}` : '',
  );

  if (authPending) {
    return <AuthLoadingState className="py-8" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
    );
  }

  if (!assessmentId) {
    return null;
  }

  if (entryFrom === 'clients' || entryFrom === 'deleted-recipients') {
    return <AuthLoadingState className="py-8" message="목록으로 이동 중…" />;
  }

  const autoOpenAddRecipient =
    (searchParams.get('addRecipient') || '').trim() === '1';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AssessmentDispatchPanel
        assessmentId={assessmentId}
        filterPortalId={portalId || undefined}
        initialSearchQuery={(searchParams.get('search') || '').trim()}
        entryFrom={entryFrom}
        autoOpenAddRecipient={autoOpenAddRecipient}
      />
    </div>
  );
}

export default function ProgressDashboardPage() {
  return (
    <Suspense fallback={<LoadingMessage layout="inline" className="py-4" textClassName="text-slate-400 text-sm" />}>
      <ProgressPageContent />
    </Suspense>
  );
}
