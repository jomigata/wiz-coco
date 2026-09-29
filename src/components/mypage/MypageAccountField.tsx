'use client';

import React from 'react';
import { mypageAccountClasses } from '@/components/layout/appChromeTheme';

type DisplayProps = {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
  selectLike?: boolean;
  calendarIcon?: boolean;
  className?: string;
};

/** 마이페이지 계정 정보 — 보기(표시) 모드 필드 */
export function MypageAccountFieldDisplay({
  label,
  value,
  multiline = false,
  selectLike = false,
  calendarIcon = false,
  className = '',
}: DisplayProps) {
  const boxCls = multiline ? mypageAccountClasses.fieldValueDisplayMultiline : mypageAccountClasses.fieldValueDisplay;
  const showTrailing = selectLike || calendarIcon;

  return (
    <div className={className}>
      <p className={mypageAccountClasses.fieldLabelDisplay}>{label}</p>
      <div className={`${boxCls} ${showTrailing ? 'justify-between gap-2' : ''}`}>
        <span className={`min-w-0 ${multiline ? '' : 'truncate'}`}>{value}</span>
        {selectLike ? (
          <svg className="h-4 w-4 shrink-0 text-blue-200/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : null}
        {calendarIcon ? (
          <svg className="h-4 w-4 shrink-0 text-blue-200/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}

export function mypageFieldEditProps() {
  return {
    labelClassName: mypageAccountClasses.fieldLabelEdit,
    fieldClassName: mypageAccountClasses.fieldInputEdit,
  };
}
