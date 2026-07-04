'use client';

import type { ReactNode } from 'react';
import { useAuthResolved } from '@/hooks/useAuthResolved';

type Props = {
  children: ReactNode;
  /** 로그인 전 대체 UI (없으면 아무것도 렌더하지 않음) */
  fallback?: ReactNode;
};

/** 로그인한 사용자에게만 상담사·파트너·요금 등 전문가 콘텐츠를 표시 */
export default function ProfessionalContentGate({ children, fallback = null }: Props) {
  const { authPending, isAuthenticated } = useAuthResolved();

  if (authPending) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
