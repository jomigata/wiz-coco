'use client';

import React from 'react';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import CounselorHierarchyBreadcrumb from '@/components/counselor/CounselorHierarchyBreadcrumb';

type CounselorPageSectionProps = {
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
  showHierarchyBreadcrumb?: boolean;
  /** 헤더·본문 패딩 축소 (수정 폼 등) */
  dense?: boolean;
};

export default function CounselorPageSection({
  title,
  toolbar,
  description,
  children,
  className = '',
  bodyClassName = '',
  noBodyPadding = false,
  showHierarchyBreadcrumb = false,
  dense = false,
}: CounselorPageSectionProps) {
  const hasHeader = Boolean(title || toolbar);

  return (
    <>
      {showHierarchyBreadcrumb ? (
        <CounselorHierarchyBreadcrumb className="mb-2 shrink-0" />
      ) : null}
      <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 ${counselorHubClasses.subsection} !p-0 ${className}`}
    >
      {hasHeader ? (
        <div
          className={`flex flex-col gap-2 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent sm:flex-row sm:items-center sm:justify-between ${
            dense ? 'px-3 py-2' : 'px-4 py-3 sm:gap-2.5'
          }`}
        >
          {title ? (
            <h2 className={`font-bold tracking-tight text-white ${dense ? 'text-sm' : 'text-sm sm:text-base'}`}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          {toolbar ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-initial">
              {toolbar}
            </div>
          ) : null}
        </div>
      ) : null}
      {description ? (
        <p className="shrink-0 border-b border-white/[0.06] bg-[#0f1d33]/40 px-4 py-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
          {description}
        </p>
      ) : null}
      <div
        className={`min-h-0 flex-1 bg-[#0f1d33]/60 ${noBodyPadding ? '' : dense ? 'p-2' : 'p-2.5 sm:p-3'} ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
    </>
  );
}

export function CounselorPageBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex min-h-0 flex-1 flex-col gap-3 ${className}`}>{children}</div>;
}
