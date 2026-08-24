'use client';

import { useEffect } from 'react';
import { useAppChromeNav } from '@/components/AppChrome';

/** 포털·검사 플로우에서 상단 전문가 로그인·메뉴 숨김 */
export function useHideAppTopNav(active = true): void {
  const { setTopNavHidden } = useAppChromeNav();

  useEffect(() => {
    if (!active) return;
    setTopNavHidden(true);
    return () => setTopNavHidden(false);
  }, [active, setTopNavHidden]);
}
