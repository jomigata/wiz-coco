'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import AppFooter from '@/components/layout/AppFooter';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { APP_CHROME_BG } from '@/lib/appChromeLayout';

const MemoNavigation = memo(Navigation);

export type TopNavMode = 'full' | 'compact';

type ChromeNavContextValue = {
  topNavMode: TopNavMode;
  setTopNavMode: (mode: TopNavMode) => void;
  /** @deprecated use topNavMode === 'compact' */
  topNavHidden: boolean;
  /** @deprecated use setTopNavMode */
  setTopNavHidden: (hidden: boolean) => void;
};

const ChromeNavContext = createContext<ChromeNavContextValue | null>(null);

export function useAppChromeNav(): ChromeNavContextValue {
  const ctx = useContext(ChromeNavContext);
  return (
    ctx ?? {
      topNavMode: 'full',
      setTopNavMode: () => {},
      topNavHidden: false,
      setTopNavHidden: () => {},
    }
  );
}

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const [topNavMode, setTopNavModeState] = useState<TopNavMode>('full');
  const setTopNavMode = useCallback((mode: TopNavMode) => {
    setTopNavModeState(mode);
  }, []);
  const setTopNavHidden = useCallback((hidden: boolean) => {
    setTopNavModeState(hidden ? 'compact' : 'full');
  }, []);

  const value = useMemo(
    () => ({
      topNavMode,
      setTopNavMode,
      topNavHidden: topNavMode === 'compact',
      setTopNavHidden,
    }),
    [topNavMode, setTopNavMode, setTopNavHidden],
  );

  const showHeader = topNavMode === 'full' || topNavMode === 'compact';

  return (
    <FirebaseAuthProvider>
      <ChromeNavContext.Provider value={value}>
        <div className="min-h-dvh flex flex-col" style={{ backgroundColor: APP_CHROME_BG }}>
          {showHeader ? (
            <div className="fixed left-0 right-0 top-0 z-50">
              <MemoNavigation />
            </div>
          ) : null}
          <div className={`relative flex min-h-dvh flex-1 flex-col ${showHeader ? 'pt-16' : 'pt-0'}`}>
            {children}
          </div>
          {topNavMode === 'full' ? <AppFooter /> : null}
        </div>
      </ChromeNavContext.Provider>
    </FirebaseAuthProvider>
  );
}
