'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import CounselorManageShell from '@/components/counselor/CounselorManageShell';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { isCounselorManageShellRoute } from '@/lib/counselorManageShell';
import { getAppRoleSync } from '@/utils/roleUtils';
import { useAuthResolved } from '@/hooks/useAuthResolved';

type Props = {
  children: React.ReactNode;
};

function CounselorSalesShellInner({ children }: Props) {
  const pathname = usePathname() || '';
  const useShell = isCounselorManageShellRoute(pathname);

  if (!useShell) {
    return <>{children}</>;
  }

  return (
    <div className={`flex min-h-[100dvh] flex-col text-white ${counselorHubClasses.page}`}>
      <main className="relative flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(72,130,210,0.1),transparent)]" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-3 py-0.5 sm:px-4 sm:py-1">
          <Suspense
            fallback={
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <LoadingMessage message="메뉴 로딩중…" textClassName="text-sm text-slate-400" />
              </div>
            }
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:max-h-[calc(100dvh-4.25rem)]">
              <CounselorManageShell>{children}</CounselorManageShell>
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

/** Discover·파트너 페이지 — 상담사 로그인 시 좌측 상담관리 메뉴 고정 */
export default function CounselorSalesPageShell({ children }: Props) {
  const { authPending } = useAuthResolved();
  const role = getAppRoleSync();
  const isCounselorUser = role === 'counselor' || role === 'admin';

  if (authPending || !isCounselorUser) {
    return <>{children}</>;
  }

  return (
    <RoleGuard allowedRoles={['counselor', 'admin']}>
      <CounselorSalesShellInner>{children}</CounselorSalesShellInner>
    </RoleGuard>
  );
}
