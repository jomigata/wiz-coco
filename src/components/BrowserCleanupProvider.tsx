'use client';

import { useEffect, useLayoutEffect } from 'react';
import { initBrowserCleanup } from '@/utils/browserCleanup';
import { evaluateAuthSessionOnStartup } from '@/utils/authSessionLifecycle';

export default function BrowserCleanupProvider() {
  useLayoutEffect(() => {
    evaluateAuthSessionOnStartup();
  }, []);

  useEffect(() => {
    const cleanup = initBrowserCleanup();
    return cleanup;
  }, []);

  return null;
}
