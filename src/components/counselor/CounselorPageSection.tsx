'use client';

import React from 'react';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import CounselorHierarchyBreadcrumb from '@/components/counselor/CounselorHierarchyBreadcrumb';
import { getSendStepSectionClasses } from '@/components/counselor/CounselorSendStepBlock';

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
  /** 검사 보내기·상담코드 생성 단계별 그라데이션 (1·2·3) */
  sendStep?: 1 | 2 | 3;
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
  sendStep,
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

  const sendStepTheme = sendStep ? getSendStepSectionClasses(sendStep) : null;

  const titleAccentClass = sendStepTheme
    ? sendStepTheme.accent
    : titleAccent === 'deleted'
      ? 'border-t-4 border-t-orange-500'
      : titleAccent === 'list'
        ? 'border-t-4 border-t-yellow-400'
        : titleAccent === 'progress'
          ? 'border-t-4 border-t-sky-400'
          : titleAccent === 'create'
            ? 'border-t-4 border-t-white'
            : '';

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      {showHierarchyBreadcrumb ? (
        <CounselorHierarchyBreadcrumb className="mb-2 shrink-0" />
      ) : null}
      <section
        className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border ${
          sendStepTheme
            ? sendStepTheme.section
            : `border-sky-400/20 ${counselorHubClasses.subsection}`
        } !p-0`}
      >
        {hasHeader ? (
          <div
            className={`flex w-full shrink-0 flex-col gap-2 border-b border-white/[0.07] sm:flex-row sm:items-center sm:justify-between ${headerPad} ${titleAccentClass} ${
              sendStepTheme ? sendStepTheme.header : 'border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent'
            }`}
          >
            {title ? (
              <h2
                className={`min-w-0 flex-1 font-bold tracking-tight text-white ${relaxed ? 'text-base' : dense ? 'text-sm' : 'text-sm sm:text-base'}`}
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
          <div className="shrink-0 border-b border-white/[0.06] bg-[#0f1d33]/40 px-4 py-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
            {description}
          </div>
        ) : null}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
            sendStepTheme ? 'bg-transparent' : 'bg-[#0f1d33]/60'
          } ${bodyPad} ${bodyClassName}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}

export function CounselorPageBody({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
