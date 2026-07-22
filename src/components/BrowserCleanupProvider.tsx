'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initBrowserCleanup } from '@/utils/browserCleanup';
import { purgeAllTestProgressStorage } from '@/utils/testResume';
import { evaluateAuthSessionOnStartup } from '@/utils/authSessionLifecycle';
import { isClientPortalLinkEntryPath } from '@/lib/clientPortalLinkEntryPaths';
import {
  resetAllSessionsBeforePortalLinkEntry,
  resetAllSessionsFromPortalLinkEntryBroadcast,
  subscribePortalLinkEntryResetEvents,
  markTabAppSessionActive,
} from '@/lib/portalLinkEntryReset';
import {
  clearClientPortalSession,
  subscribePortalClearEvents,
} from '@/lib/clientPortalSession';

export default function BrowserCleanupProvider() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const startupEvaluatedRef = useRef(false);

  useLayoutEffect(() => {
    if (isClientPortalLinkEntryPath(pathname)) {
      void resetAllSessionsBeforePortalLinkEntry();
      return;
    }
    markTabAppSessionActive();
    if (!startupEvaluatedRef.current) {
      startupEvaluatedRef.current = true;
      evaluateAuthSessionOnStartup();
    }
  }, [pathname]);

  useEffect(() => {
    purgeAllTestProgressStorage();
    const cleanup = initBrowserCleanup();
    return cleanup;
  }, []);

  useEffect(() => {
    return subscribePortalClearEvents(() => {
      clearClientPortalSession();
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/portal')) {
        router.replace('/portal/login/');
      }
    });
  }, [router]);

  useEffect(() => {
    return subscribePortalLinkEntryResetEvents(() => {
      void resetAllSessionsFromPortalLinkEntryBroadcast().then(() => {
        const path = window.location.pathname || '';
        if (path.startsWith('/portal') && !isClientPortalLinkEntryPath(path)) {
          router.replace('/portal/login/');
        }
      });
    });
  }, [router]);

  return null;
}
