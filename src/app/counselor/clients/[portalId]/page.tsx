'use client';

import CounselorClientDetail from '@/components/counselor/CounselorClientDetail';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

type Props = {
  params: { portalId: string };
};

export default function ClientDetailPage({ params }: Props) {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 내담자 상세를 이용할 수 있습니다." />
    );
  }

  return <CounselorClientDetail portalId={params.portalId} />;
}
