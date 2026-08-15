'use client';

import React, { useState } from 'react';

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
  className?: string;
  onClick?: () => void;
};

/** 값1/값2 표시 — hover 시 2줄 풍선 (1: 상담유형·코드, 2: 그룹명/제목) */
export default function CounselorSlashInfoCell({
  primary,
  secondary,
  hoverTypeLabel,
  hoverAccessCode,
  hoverExtra,
  showTooltip = true,
  normalWeight = false,
  normalSecondary = false,
  className = '',
  onClick,
}: Props) {
  const [hover, setHover] = useState(false);
  const line = `${primary} / ${secondary}`;
  const tooltipVisible =
    showTooltip && hover && (hoverTypeLabel || hoverAccessCode || hoverExtra);

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <span className="block max-w-full truncate">
        <span className={`${normalWeight ? 'font-normal' : 'font-medium'} text-white`}>{primary || '—'}</span>
        <span className="text-slate-300"> / </span>
        <span className={`${normalWeight || normalSecondary ? 'font-normal' : ''} text-slate-200`}>{secondary || '—'}</span>
      </span>
      {tooltipVisible ? (
        <div
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 min-w-[10rem] max-w-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-snug text-slate-800 shadow-lg"
          role="tooltip"
        >
          {hoverTypeLabel || hoverAccessCode ? (
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
          )}
        </div>
      ) : null}
      <span className="sr-only">{line}</span>
    </div>
  );
}
