'use client';

import AdminPageLayout from '@/components/AdminPageLayout';
import CounselorPortalChatPanel from '@/components/counselor/CounselorPortalChatPanel';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';

export default function CounselorChatPage() {
  const { authPending, showLoginRequired } = useAuthResolved();

  if (authPending) {
    return <AuthLoadingState className="py-16" message="확인 중…" />;
  }

  if (showLoginRequired) {
    return (
      <AuthRequiredState description="Firebase에 로그인한 상태에서 1:1 채팅을 이용할 수 있습니다." />
    );
  }

  return (
    <AdminPageLayout
      sectionTitle="1:1 채팅"
      description="내 검사실에서 문의한 내담자와 1:1로 대화합니다."
      noBodyPadding
    >
      <CounselorPortalChatPanel />
    </AdminPageLayout>
  );
}
