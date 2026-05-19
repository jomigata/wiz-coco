import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

/**
 * 인증 확인이 끝나기 전에는 로그인 필요 UI를 표시하지 않도록 하는 헬퍼.
 */
export function useAuthResolved() {
  const { user, loading: authPending } = useFirebaseAuth();
  return {
    user,
    authPending,
    showLoginRequired: !authPending && !user,
    isAuthenticated: !authPending && !!user,
  };
}
