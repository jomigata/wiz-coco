'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useHideAppTopNav } from '@/hooks/useHideAppTopNav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isGuide = pathname.startsWith('/portal/guide');
  useHideAppTopNav(!isGuide);
  return <>{children}</>;
}
