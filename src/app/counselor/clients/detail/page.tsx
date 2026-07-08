'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CounselorClientDetail from '@/components/counselor/CounselorClientDetail';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function ClientDetailPage() {
  const router = useRouter();
  const [portalId, setPortalId] = useState('');
  const { authPending, showLoginRequired } = useAuthResolved();

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
    if (!authPending && !showLoginRequired && portalId === '' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('portalId')) {
        router.replace('/counselor/clients');
      }
    }
  }, [authPending, showLoginRequired, portalId, router]);

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 내담자 상세를 이용할 수 있습니다." />
    );
  }

  if (!portalId) {
    return <p className="py-12 text-center text-sm text-slate-500">내담자를 선택해 주세요.</p>;
  }

  return <CounselorClientDetail portalId={portalId} />;
}
