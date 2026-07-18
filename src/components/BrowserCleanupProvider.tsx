'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initBrowserCleanup } from '@/utils/browserCleanup';
import { evaluateAuthSessionOnStartup } from '@/utils/authSessionLifecycle';
import {
  clearClientPortalSession,
  subscribePortalClearEvents,
} from '@/lib/clientPortalSession';

export default function BrowserCleanupProvider() {
  const router = useRouter();

  useLayoutEffect(() => {
    evaluateAuthSessionOnStartup();
  }, []);

  useEffect(() => {
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

  return null;
}
