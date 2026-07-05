'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import AppFooter from '@/components/layout/AppFooter';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import {
  APP_BODY_BG,
  APP_MAIN_BOTTOM_PAD,
} from '@/components/layout/appChromeTheme';

const MemoNavigation = memo(Navigation);

type ChromeNavContextValue = {
  /** true이면 전역 상단·하단 크롬을 숨김 (전체 화면 검사 단계 등) */
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
 * 전역 상단·하단 크롬을 한 곳에서 렌더링합니다.
 * 본문은 상단(4rem)·하단(2.75rem) 패딩으로 고정 영역과 겹치지 않습니다.
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
    <FirebaseAuthProvider>
      <ChromeNavContext.Provider value={value}>
        <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: APP_BODY_BG }}>
          {!topNavHidden ? (
            <div className="fixed left-0 right-0 top-0 z-50">
              <MemoNavigation />
            </div>
          ) : null}
          <div className={`flex min-h-[100dvh] flex-1 flex-col ${topNavHidden ? '' : APP_MAIN_BOTTOM_PAD}`}>
            {children}
          </div>
          {!topNavHidden ? <AppFooter /> : null}
        </div>
      </ChromeNavContext.Provider>
    </FirebaseAuthProvider>
  );
}
