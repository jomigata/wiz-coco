'use client';

import React from 'react';
import CounselorListHoverTooltip from '@/components/counselor/CounselorListHoverTooltip';

type Props = {
  primary: string;
  secondary: string;
  hoverTypeLabel?: string;
  hoverAccessCode?: string;
  /** @deprecated hoverTypeLabel + hoverAccessCode 사용 권장 */
  hoverExtra?: string;
  /** false이면 hover 말풍선 비표시 */
  showTooltip?: boolean;
  /** true이면 primary/secondary 모두 보통 굵기 */
  normalWeight?: boolean;
  /** true이면 secondary(두 번째 값)만 보통 굵기 */
  normalSecondary?: boolean;
  /** 가운데 값 (예: 상담코드) — primary / mid / secondary 3단 표시 */
  mid?: string;
  /** mid 글자색 클래스 (기본: text-slate-500) */
  midClassName?: string;
  className?: string;
  onClick?: () => void;
};

/** 값1/값2 표시 — hover 시 2줄 풍선 (1: 상담유형·코드, 2: 그룹명/소속) */
export default function CounselorSlashInfoCell({
  primary,
  secondary,
  hoverTypeLabel,
  hoverAccessCode,
  hoverExtra,
  showTooltip = true,
  normalWeight = false,
  normalSecondary = false,
  mid,
  midClassName = 'text-slate-500',
  className = '',
  onClick,
}: Props) {
  const line = mid ? `${primary} / ${mid} / ${secondary}` : `${primary} / ${secondary}`;
  const tooltipEnabled =
    showTooltip && Boolean(hoverTypeLabel || hoverAccessCode || hoverExtra);

  const tooltipContent =
    hoverTypeLabel || hoverAccessCode ? (
      <>
        <p className="font-medium text-slate-700">
          ({hoverTypeLabel || '—'}) ({hoverAccessCode || '—'})
        </p>
        <p className="mt-0.5 text-slate-600">
          {primary || '—'} / {secondary || '—'}
        </p>
      </>
    ) : (
      <p className="font-medium text-slate-700">{hoverExtra}</p>
    );

  return (
    <CounselorListHoverTooltip
      enabled={tooltipEnabled}
      content={tooltipContent}
      align="start"
      tooltipClassName="px-3 py-2 text-sm"
      wrapperClassName={`relative min-w-0 max-w-full ${className}`}
      onClick={onClick}
    >
      <span className="block max-w-full truncate">
        <span className={`${normalWeight ? 'font-normal' : 'font-medium'} text-white`}>{primary || '—'}</span>
        <span className="text-slate-300"> / </span>
        {mid !== undefined ? (
          <>
            <span className={`${normalWeight ? 'font-normal' : ''} ${midClassName}`}>{mid || '—'}</span>
            <span className="text-slate-300"> / </span>
          </>
        ) : null}
        <span className={`${normalWeight || normalSecondary ? 'font-normal' : ''} text-slate-200`}>{secondary || '—'}</span>
      </span>
      <span className="sr-only">{line}</span>
    </CounselorListHoverTooltip>
  );
}
