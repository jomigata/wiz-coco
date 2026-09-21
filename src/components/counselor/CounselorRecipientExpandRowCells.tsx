'use client';

import React from 'react';
import AuthLink from '@/components/auth/AuthLink';
import { buildCounselorPortalChatHref } from '@/lib/portalChatApi';
import { counselorListSelectTdClass } from '@/lib/counselorListTableStyles';

const expandCellBorder = 'border-b border-slate-700/60 bg-slate-900/20';

/** 펼침 행 검사 목록·채팅 열 공통 패널 */
const expandDetailPanelClass =
  'overflow-hidden rounded-lg border border-slate-600/80 bg-slate-950/55 shadow-inner';

const expandDetailPanelHeaderClass =
  'border-b border-slate-700/70 bg-slate-900/40 text-xs font-medium text-slate-400';

type ChatColumnProps = {
  portalId: string;
};

/** 펼침 행 — 상위 목록 체크박스 열과 같은 위치의 1:1 채팅 */
export function CounselorRecipientExpandChatColumn({ portalId }: ChatColumnProps) {
  const id = portalId.trim();
  return (
    <td
      className={`${counselorListSelectTdClass} ${expandCellBorder} align-top pt-3 pb-4`}
      onClick={(e) => e.stopPropagation()}
    >
      {id ? (
        <AuthLink
          href={buildCounselorPortalChatHref(id)}
          className={`flex min-w-[2.75rem] flex-col text-inherit no-underline transition-colors hover:border-sky-500/35 hover:bg-slate-900/65 ${expandDetailPanelClass}`}
          title="채팅"
          aria-label="채팅"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            className={`${expandDetailPanelHeaderClass} block px-1 py-2 text-center leading-tight`}
          >
            채팅
          </span>
          <span className="flex flex-1 items-center justify-center px-1 py-2.5 text-base leading-none">
            <span aria-hidden>💬</span>
          </span>
        </AuthLink>
      ) : (
        <div className={`flex min-w-[2.75rem] flex-col ${expandDetailPanelClass}`}>
          <div
            className={`${expandDetailPanelHeaderClass} px-1 py-2 text-center leading-tight`}
          >
            채팅
          </div>
          <div className="flex justify-center px-1 py-2.5">
            <span className="text-slate-600" aria-hidden>
              —
            </span>
          </div>
        </div>
      )}
    </td>
  );
}

type LeadingCellsProps = {
  leadingColSpan: number;
  portalId: string;
};

/** No·체크박스 열 — 체크박스 아래 1:1 채팅 열 포함 */
export function CounselorRecipientExpandLeadingCells({ leadingColSpan, portalId }: LeadingCellsProps) {
  if (leadingColSpan <= 0) return null;

  if (leadingColSpan < 2) {
    return (
      <td
        colSpan={leadingColSpan}
        className={`${expandCellBorder} p-0`}
        aria-hidden="true"
      />
    );
  }

  const extraLeading = Math.max(0, leadingColSpan - 2);

  return (
    <>
      <td className={`${expandCellBorder} p-0`} aria-hidden="true" />
      <CounselorRecipientExpandChatColumn portalId={portalId} />
      {extraLeading > 0 ? (
        <td colSpan={extraLeading} className={`${expandCellBorder} p-0`} aria-hidden="true" />
      ) : null}
    </>
  );
}
