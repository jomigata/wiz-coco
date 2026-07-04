'use client';

import type { ReactNode } from 'react';
import CounselorProfessionalAccessGate from '@/components/auth/CounselorProfessionalAccessGate';

type Props = {
  children: ReactNode;
  /** 로그인 전 대체 UI (없으면 아무것도 렌더하지 않음) */
  fallback?: ReactNode;
};

/** 승인된 상담사·관리자에게만 상담사·파트너·요금 등 전문가 콘텐츠를 표시 */
export default function ProfessionalContentGate({ children, fallback = null }: Props) {
  return (
    <CounselorProfessionalAccessGate loginFallback={fallback} unapprovedFallback={null}>
      {children}
    </CounselorProfessionalAccessGate>
  );
}
