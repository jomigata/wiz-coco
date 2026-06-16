'use client';

import React from 'react';
import type { AdminCounselorApplicationRow } from '@/lib/firestore/counselorApplicationsStore';

interface Props {
  history: AdminCounselorApplicationRow[];
  getStatusText: (status: AdminCounselorApplicationRow['status']) => string;
  getStatusBadgeClass: (status: AdminCounselorApplicationRow['status']) => string;
}

export default function CounselorApplicationHistoryPanel({
  history,
  getStatusText,
  getStatusBadgeClass,
}: Props) {
  if (history.length <= 1) return null;

  const past = history.slice(1);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-medium text-slate-400 mb-2">
        이전 신청 내역 ({past.length}건) — 최종 결과는 최신 신청 기준
      </p>
      <ul className="space-y-2 max-h-48 overflow-y-auto">
        {past.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-white/5 bg-black/20 px-2 py-1.5 text-xs"
          >
            <div className="min-w-0">
              <p className="text-slate-300">
                {item.appliedDate
                  ? new Date(item.appliedDate).toLocaleDateString('ko-KR')
                  : '-'}
              </p>
              {item.reviewNotes && (
                <p className="text-slate-500 mt-0.5 whitespace-pre-wrap">{item.reviewNotes}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusBadgeClass(item.status)}`}
            >
              {getStatusText(item.status)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
