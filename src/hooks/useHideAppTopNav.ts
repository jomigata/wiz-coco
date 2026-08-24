'use client';

import { useEffect } from 'react';
import { useAppChromeNav } from '@/components/AppChrome';

/** 포털·검사 플로우 — 좌측 홈 타이틀만 표시, 전문가 로그인·메뉴 숨김 */
export function useHideAppTopNav(active = true): void {
  const { setTopNavMode } = useAppChromeNav();

  useEffect(() => {
    if (!active) return;
    setTopNavMode('compact');
    return () => setTopNavMode('full');
  }, [active, setTopNavMode]);
}
