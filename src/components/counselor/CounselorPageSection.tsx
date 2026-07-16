'use client';

import React from 'react';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type CounselorPageSectionProps = {
  /** 중분류 띠 제목 */
  title?: React.ReactNode;
  /** 제목 영역 우측 툴바 */
  toolbar?: React.ReactNode;
  /** 본문 상단 설명 */
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
};

/** 상담관리 페이지 — 중분류 띠 + 소분류 본문 영역 */
export default function CounselorPageSection({
  title,
  toolbar,
  description,
  children,
  className = '',
  bodyClassName = '',
  noBodyPadding = false,
}: CounselorPageSectionProps) {
  const hasHeader = Boolean(title || toolbar);

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 ${counselorHubClasses.subsection} !p-0 ${className}`}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-2.5 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {title ? (
            <h2 className="text-sm font-bold tracking-tight text-white sm:text-base">{title}</h2>
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
        className={`min-h-0 flex-1 bg-[#0f1d33]/60 ${noBodyPadding ? '' : 'p-2.5 sm:p-3'} ${bodyClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

/** 레이아웃 본문 래퍼 */
export function CounselorPageBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex min-h-0 flex-1 flex-col gap-3 ${className}`}>{children}</div>;
}
