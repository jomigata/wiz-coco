'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  bindInternalNavigationMarkers,
  consumeInternalNavigationFlags,
  markInternalNavigation,
  touchAuthHeartbeat,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';

/** 사이트 내부 이동과 탭/브라우저 종료를 구분해 로그인 세션이 오탐 삭제되지 않게 합니다. */
export default function AuthNavigationGuard() {
  const pathname = usePathname();

  useEffect(() => {
    markInternalNavigation();
    tryRestoreAuthenticatedTabSession();
    touchAuthHeartbeat();

    const timer = window.setTimeout(() => {
      consumeInternalNavigationFlags();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => bindInternalNavigationMarkers(), []);

  return null;
}
