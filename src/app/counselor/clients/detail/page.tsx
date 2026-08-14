'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCounselorClientPortalDetail } from '@/lib/clientPortalApi';
import { counselorClientProgressHref } from '@/lib/counselorClientRoutes';
import { rememberCounselorAssessmentContext } from '@/lib/counselorNestedNav';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

/** 레거시 내담자 상세 URL → 상담진행 현황으로 리다이렉트 */
export default function ClientDetailPage() {
  const router = useRouter();
  const [portalId, setPortalId] = useState('');
  const { authPending, showLoginRequired, isAuthenticated } = useAuthResolved();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setPortalId((params.get('portalId') || '').trim());
    } catch {
      setPortalId('');
    }
  }, []);

  useEffect(() => {
    if (authPending || !isAuthenticated || !portalId) return;

    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchCounselorClientPortalDetail(portalId);
        const assessmentId = detail.assessments?.[0]?.assessmentId || '';
        if (cancelled) return;
        if (assessmentId) {
          rememberCounselorAssessmentContext(assessmentId);
          router.replace(counselorClientProgressHref(assessmentId, portalId));
        } else {
          router.replace('/counselor/clients');
        }
      } catch {
        if (!cancelled) router.replace('/counselor/clients');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authPending, isAuthenticated, portalId, router]);

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 내담자 정보를 이용할 수 있습니다." />
    );
  }

  return <AuthLoadingState className="py-16" message="상담진행 현황으로 이동 중…" />;
}
