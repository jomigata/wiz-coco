'use client';

import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import CounselorPortalChatPanel from '@/components/counselor/CounselorPortalChatPanel';

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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <CounselorPortalChatPanel />
    </div>
  );
}
