'use client';

import React, { useState } from 'react';

type Props = {
  primary: string;
  secondary: string;
  hoverExtra?: string;
  className?: string;
  onClick?: () => void;
};

/** 값1/값2 표시 — hover 시 hoverExtra를 아래에 표시 */
export default function CounselorSlashInfoCell({
  primary,
  secondary,
  hoverExtra,
  className = '',
  onClick,
}: Props) {
  const [hover, setHover] = useState(false);
  const line = `${primary}/${secondary}`;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <span className="truncate max-w-full block" title={line}>
        <span className="font-medium text-white">{primary || '—'}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-200">{secondary || '—'}</span>
      </span>
      {hover && hoverExtra ? (
        <div className="absolute left-0 top-full z-30 mt-0.5 whitespace-nowrap rounded border border-white/15 bg-slate-900 px-2 py-1 text-xs text-sky-200 shadow-lg">
          {hoverExtra}
        </div>
      ) : null}
    </div>
  );
}
