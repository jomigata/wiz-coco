'use client';

import React, { useState } from 'react';

type Props = {
  primary: string;
  secondary: string;
  hoverExtra?: string;
  className?: string;
  onClick?: () => void;
};

/** 값1/값2 표시 — hover 시 hoverExtra를 위쪽 풍선으로 표시 */
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
      <span className="block max-w-full truncate">
        <span className="font-medium text-white">{primary || '—'}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-200">{secondary || '—'}</span>
      </span>
      {hover && hoverExtra ? (
        <div
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 whitespace-nowrap rounded-md border border-sky-500/35 bg-slate-950 px-3 py-2 text-sm font-medium leading-snug text-sky-100 shadow-xl"
          role="tooltip"
        >
          {hoverExtra}
        </div>
      ) : null}
      <span className="sr-only">{line}</span>
    </div>
  );
}
