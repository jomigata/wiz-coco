'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import PageHierarchyBreadcrumb from '@/components/navigation/PageHierarchyBreadcrumb';
import { resolveCounselorHierarchy } from '@/lib/pageHierarchyNav';

function CounselorHierarchyBreadcrumbInner({ className = '' }: { className?: string }) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const nav = resolveCounselorHierarchy(pathname, searchParams);
  if (!nav || nav.crumbs.length === 0) return null;
  return <PageHierarchyBreadcrumb crumbs={nav.crumbs} useAuthLinks className={className} />;
}

export default function CounselorHierarchyBreadcrumb({ className = '' }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <CounselorHierarchyBreadcrumbInner className={className} />
    </Suspense>
  );
}
