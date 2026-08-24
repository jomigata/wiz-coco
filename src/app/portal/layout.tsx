'use client';

import React from 'react';
import { useHideAppTopNav } from '@/hooks/useHideAppTopNav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  useHideAppTopNav(true);
  return <>{children}</>;
}
