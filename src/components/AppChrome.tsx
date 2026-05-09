'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';

type ChromeNavContextValue = {
  /** true이면 전역 상단 네비게이션을 숨김 (전체 화면 검사 단계 등) */
  topNavHidden: boolean;
  setTopNavHidden: (hidden: boolean) => void;
};

const ChromeNavContext = createContext<ChromeNavContextValue | null>(null);

/** 레이아웃 밖에서는 숨김 제어만 noop 처리됩니다. */
export function useAppChromeNav(): ChromeNavContextValue {
  const ctx = useContext(ChromeNavContext);
  return (
    ctx ?? {
      topNavHidden: false,
      setTopNavHidden: () => {},
    }
  );
}

/**
 * 전역 상단 네비게이션을 한 곳에서만 렌더링해 페이지 전환 시 리마운트·깜빡임을 줄입니다.
 * 하위 페이지는 기존처럼 본문에 pt-16 등 오프셋을 유지하면 됩니다.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [topNavHidden, setTopNavHiddenState] = useState(false);
  const setTopNavHidden = useCallback((hidden: boolean) => {
    setTopNavHiddenState(hidden);
  }, []);

  const value = useMemo(
    () => ({ topNavHidden, setTopNavHidden }),
    [topNavHidden, setTopNavHidden],
  );

  return (
    <ChromeNavContext.Provider value={value}>
      {!topNavHidden ? (
        <div className="fixed left-0 right-0 top-0 z-50">
          <Navigation />
        </div>
      ) : null}
      {children}
    </ChromeNavContext.Provider>
  );
}
