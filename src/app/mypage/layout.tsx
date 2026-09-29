'use client';

import React, { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MypageManageShell from '@/components/mypage/MypageManageShell';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { isMypageLegacyTabRoute, isMypageShellRoute } from '@/lib/mypageAccountNav';
import { useCounselorApplicationNotificationCount } from '@/hooks/useCounselorApplicationNotificationCount';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

function MypageLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user } = useFirebaseAuth();
  const settingsBadge = useCounselorApplicationNotificationCount(
    user?.uid || '',
    user?.role || 'user',
  );

  const legacyTab = isMypageLegacyTabRoute(pathname, tab);
  const useShell = isMypageShellRoute(pathname) && !legacyTab;

  if (!useShell) {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden text-white ${counselorHubClasses.page}`}
    >
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={`pointer-events-none absolute inset-0 ${counselorHubClasses.pageGlow}`} />
        <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1920px] flex-1 flex-col overflow-hidden px-3 py-0.5 sm:px-4 sm:py-1">
          <MypageManageShell settingsBadge={settingsBadge}>{children}</MypageManageShell>
        </div>
      </main>
    </div>
  );
}

export default function MypageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className={`flex min-h-[50vh] items-center justify-center ${counselorHubClasses.page}`}>
          <LoadingMessage message="마이페이지 로딩중…" textClassName="text-sm text-slate-400" />
        </div>
      }
    >
      <MypageLayoutInner>{children}</MypageLayoutInner>
    </Suspense>
  );
}
