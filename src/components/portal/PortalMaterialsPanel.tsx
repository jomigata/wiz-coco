'use client';

import React from 'react';
import type { PortalLegacyResultItem } from '@/lib/clientPortalApi';
import { formatCompletedAt } from '@/lib/portalTestResults';

export type PortalMaterialsPanelProps = {
  materials: PortalLegacyResultItem[];
  onViewResult: (item: PortalLegacyResultItem) => void;
  onContinueTest?: (item: PortalLegacyResultItem) => void;
};

function statusLabel(status: string): { text: string; className: string } {
  if (status === 'completed') {
    return { text: '완료', className: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40' };
  }
  if (status === 'in_progress') {
    return { text: '진행 중', className: 'bg-sky-900/50 text-sky-300 border-sky-700/40' };
  }
  return { text: '미실시', className: 'bg-slate-700/80 text-slate-300 border-slate-600' };
}

export default function PortalMaterialsPanel({
  materials,
  onViewResult,
  onContinueTest,
}: PortalMaterialsPanelProps) {
  if (!materials.length) {
    return (
      <div className="rounded-2xl border border-slate-600 bg-slate-800/80 p-6">
        <p className="text-slate-400 text-sm">기타 자료가 없습니다.</p>
        <p className="text-slate-500 text-xs mt-2">
          상담코드 이동 후 이전 상담에만 있던 추가 검사·기록이 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        현재 상담코드에 포함되지 않은 추가 검사·기록입니다. 필요 시 열람하거나 이어서 진행할 수 있습니다.
      </p>
      <ul className="space-y-2">
        {materials.map((item) => {
          const name = item.testName || item.testId;
          const origin = (item.originAssessmentTitle || '').trim();
          const badge = statusLabel(item.status || '');
          const canView = item.status === 'completed';
          const canContinue = item.status === 'in_progress' && onContinueTest;

          return (
            <li
              key={item.resultId}
              className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-white">{name}</p>
                  {origin ? (
                    <p className="text-xs text-slate-500 mt-0.5">출처: {origin}</p>
                  ) : null}
                  {item.completedAt ? (
                    <p className="text-xs text-slate-400 mt-1">
                      완료 {formatCompletedAt(item.completedAt)}
                    </p>
                  ) : item.updatedAt ? (
                    <p className="text-xs text-slate-400 mt-1">최근 수정 {formatCompletedAt(item.updatedAt)}</p>
                  ) : null}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${badge.className}`}>
                  {badge.text}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {canView ? (
                  <button
                    type="button"
                    onClick={() => onViewResult(item)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600"
                  >
                    결과 보기
                  </button>
                ) : null}
                {canContinue ? (
                  <button
                    type="button"
                    onClick={() => onContinueTest!(item)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-cyan-900/50 border border-cyan-700/50 text-cyan-200 hover:bg-cyan-900/70"
                  >
                    이어하기
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
