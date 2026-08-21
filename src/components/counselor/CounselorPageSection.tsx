'use client';

import React from 'react';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import CounselorHierarchyBreadcrumb from '@/components/counselor/CounselorHierarchyBreadcrumb';

type CounselorPageSectionProps = {
  title?: React.ReactNode;
  /** 타이틀 행 우측 링크·버튼 (toolbar 앞) */
  headerAction?: React.ReactNode;
  /** 타이틀 블록 상단 강조선 */
  titleAccent?: 'list' | 'deleted' | 'progress' | 'create';
  toolbar?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
  showHierarchyBreadcrumb?: boolean;
  /** 헤더·본문 패딩 축소 (수정 폼 등) */
  dense?: boolean;
  /** 블록 여백 확대 (수정 화면 가독성) */
  relaxed?: boolean;
  /** 타이틀·검색 줄 — light는 흰 배경 + 어두운 글자 */
  chromeTone?: 'default' | 'light';
};

export default function CounselorPageSection({
  title,
  headerAction,
  titleAccent,
  toolbar,
  description,
  children,
  className = '',
  bodyClassName = '',
  noBodyPadding = false,
  showHierarchyBreadcrumb = false,
  dense = false,
  relaxed = false,
  chromeTone = 'default',
}: CounselorPageSectionProps) {
  const hasHeader = Boolean(title || headerAction || toolbar);
  const headerPad = relaxed ? 'px-4 py-3.5' : dense ? 'px-3 py-2.5' : 'px-4 py-3 sm:gap-2.5';
  const bodyPad = noBodyPadding
    ? ''
    : relaxed
      ? 'p-4 sm:p-5'
      : dense
        ? 'p-2.5'
        : 'p-2.5 sm:p-3';

  const titleAccentClass =
    titleAccent === 'deleted'
      ? 'border-t-4 border-t-orange-500'
      : titleAccent === 'list'
        ? 'border-t-4 border-t-yellow-400'
        : titleAccent === 'progress'
          ? 'border-t-4 border-t-sky-400'
          : titleAccent === 'create'
            ? 'border-t-4 border-t-white'
            : '';

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
          className={`flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${headerPad} ${titleAccentClass} ${
            chromeTone === 'light'
              ? 'border-b border-slate-200 bg-white'
              : 'border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent'
          }`}
        >
          {title ? (
            <h2
              className={`min-w-0 flex-1 font-bold tracking-tight ${
                chromeTone === 'light' ? 'text-slate-800' : 'text-white'
              } ${relaxed ? 'text-base' : dense ? 'text-sm' : 'text-sm sm:text-base'}`}
            >
              {title}
            </h2>
          ) : (
            <span className="flex-1" />
          )}
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:ml-auto">
            {headerAction}
            {toolbar ? (
              <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                {toolbar}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {description ? (
        <div
          className={`shrink-0 px-4 py-2 text-xs leading-relaxed sm:text-sm ${
            chromeTone === 'light'
              ? 'border-b border-slate-200 bg-white text-slate-500'
              : 'border-b border-white/[0.06] bg-[#0f1d33]/40 text-slate-400'
          }`}
        >
          {description}
        </div>
      ) : null}
      <div
        className={`min-h-0 flex-1 bg-[#0f1d33]/60 ${bodyPad} ${bodyClassName}`}
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
  return <div className={`flex min-h-0 flex-1 flex-col gap-2 ${className}`}>{children}</div>;
}
