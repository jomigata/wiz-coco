'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import PageHierarchyBreadcrumb from '@/components/navigation/PageHierarchyBreadcrumb';
import { resolveCounselorHierarchy } from '@/lib/pageHierarchyNav';

function CounselorPageHeaderInner({ pageTitle }: { pageTitle: string }) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const nav = resolveCounselorHierarchy(pathname, searchParams);

  return (
    <header className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/20 via-[#162b4a] to-[#0f172a] py-3 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-1 px-4 sm:px-6">
        {nav ? <PageHierarchyBreadcrumb crumbs={nav.crumbs} useAuthLinks className="mb-1" /> : null}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
            {pageTitle}
          </h1>
          <p className="mt-0.5 text-xs text-sky-200/55">콘텐츠 상담 관리 시스템</p>
        </div>
      </div>
    </header>
  );
}

export default function CounselorPageHeader({ pageTitle }: { pageTitle: string }) {
  return (
    <Suspense
      fallback={
        <header className="shrink-0 border-b border-sky-400/20 bg-gradient-to-r from-sky-600/20 via-[#162b4a] to-[#0f172a] py-3 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-6">
            <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-xs text-sky-200/55">콘텐츠 상담 관리 시스템</p>
          </div>
        </header>
      }
    >
      <CounselorPageHeaderInner pageTitle={pageTitle} />
    </Suspense>
  );
}
