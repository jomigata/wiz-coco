'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, memo } from 'react';
import Navigation from '@/components/Navigation';
import AppFooter from '@/components/layout/AppFooter';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { APP_FOOTER_PB } from '@/lib/appChromeLayout';
import { appChromeClasses } from '@/components/layout/appChromeTheme';

const MemoNavigation = memo(Navigation);

type ChromeNavContextValue = {
  topNavHidden: boolean;
  setTopNavHidden: (hidden: boolean) => void;
};

const ChromeNavContext = createContext<ChromeNavContextValue | null>(null);

export function useAppChromeNav(): ChromeNavContextValue {
  const ctx = useContext(ChromeNavContext);
  return (
    ctx ?? {
      topNavHidden: false,
      setTopNavHidden: () => {},
    }
  );
}

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
        <div className={`relative min-h-dvh flex flex-col ${appChromeClasses.page}`}>
          <div
            className={`pointer-events-none fixed inset-0 -z-10 ${appChromeClasses.pageGradient}`}
            aria-hidden
          />
          {!topNavHidden ? (
            <div className="fixed left-0 right-0 top-0 z-50">
              <MemoNavigation />
            </div>
          ) : null}
          <div className={`relative flex min-h-dvh flex-1 flex-col ${APP_FOOTER_PB}`}>{children}</div>
          {!topNavHidden ? <AppFooter /> : null}
        </div>
      </ChromeNavContext.Provider>
    </FirebaseAuthProvider>
  );
}
