'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { resolveCounselorHierarchy } from '@/lib/pageHierarchyNav';

const CounselorHierarchyDepthContext = createContext<number>(0);

export function CounselorHierarchyDepthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const nav = resolveCounselorHierarchy(pathname, searchParams);
  return (
    <CounselorHierarchyDepthContext.Provider value={nav?.depth ?? 0}>
      {children}
    </CounselorHierarchyDepthContext.Provider>
  );
}

export function useCounselorHierarchyDepth(): number {
  return useContext(CounselorHierarchyDepthContext);
}
