'use client';

import React from 'react';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import type { DispatchRecipient } from '@/lib/clientPortalApi';
import { dispatchStatusDisplay, testSummary } from '@/lib/dispatchRecipientDisplay';
import CounselorListTableScroll from '@/components/counselor/CounselorListTableScroll';
import DispatchStatusText from '@/components/counselor/DispatchStatusText';

type Props = {
  recipients: DispatchRecipient[];
  loading: boolean;
  error: string;
  leadingColSpan: number;
  detailColSpan: number;
};

export default function CounselorDeletedAssessmentRecipientsSummary({
  recipients,
  loading,
  error,
  leadingColSpan,
  detailColSpan,
}: Props) {
  return (
    <tr>
      <td colSpan={leadingColSpan} className="border-b border-slate-700/60 bg-slate-900/20 p-0" aria-hidden />
      <td
        colSpan={detailColSpan}
        className="border-b border-slate-700/60 bg-slate-900/20 px-3 py-3 pb-4 align-top"
      >
        {loading ? (
          <p className="text-sm text-slate-400">내담자 현황을 불러오는 중…</p>
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-slate-500">등록된 내담자가 없습니다.</p>
        ) : (
          <CounselorListTableScroll className="rounded-lg border border-slate-700/50">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-slate-700/80 text-xs text-slate-400">
                  <th className="px-3 py-2 text-left font-medium">이름 / 나의코드</th>
                  <th className="px-3 py-2 text-left font-medium">검사 진행</th>
                  <th className="px-3 py-2 text-left font-medium">발송</th>
                  <th className="px-3 py-2 text-left font-medium">연락처</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => {
                  const progress = testSummary(r);
                  const notify = dispatchStatusDisplay(r);
                  const phone = formatPhoneDisplay(r.phone);
                  const email = (r.email || '').trim();
                  return (
                    <tr key={r.portalId} className="border-b border-slate-800/80 last:border-0">
                      <td className="px-3 py-2 align-middle text-white">
                        <span className="font-medium">{r.displayName || '—'}</span>
                        <span className="text-slate-500"> / </span>
                        <span className="font-mono text-xs text-cyan-300/90">
                          {formatAccessCodeDisplay(r.myCode || '')}
                        </span>
                      </td>
                      <td className={`px-3 py-2 align-middle text-sm ${progress.className}`}>
                        {progress.text}
                      </td>
                      <td className="px-3 py-2 align-middle text-sm">
                        <DispatchStatusText value={notify} />
                      </td>
                      <td className="px-3 py-2 align-middle text-xs leading-snug text-slate-300">
                        {phone ? <span className="block tabular-nums">{phone}</span> : null}
                        {email ? <span className="block break-all">{email}</span> : null}
                        {!phone && !email ? <span className="text-slate-500">—</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CounselorListTableScroll>
        )}
      </td>
    </tr>
  );
}
