'use client';

import React from 'react';

type Props = {
  title: string;
  /** 예: `예약 · 9. 28. 오후 3:00` */
  detail?: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
};

/** 삭제·예약 등 — 본문과 같은 톤의 한 줄 + 작은 액션 버튼 */
export default function CounselorRecommendInlineRow({
  title,
  detail,
  actionLabel,
  onAction,
  disabled = false,
}: Props) {
  return (
    <p className="mt-2 text-sm font-normal leading-snug text-slate-300">
      <span>{title}</span>
      {detail ? (
        <>
          <span className="text-slate-500"> · </span>
          <span className="text-slate-400">{detail}</span>
        </>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={onAction}
        className="ml-1.5 inline text-[11px] font-normal text-slate-500 underline-offset-2 hover:text-sky-300 hover:underline disabled:opacity-40"
      >
        {actionLabel}
      </button>
    </p>
  );
}
