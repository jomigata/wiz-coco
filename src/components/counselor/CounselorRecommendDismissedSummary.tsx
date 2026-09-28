'use client';

import React, { useMemo } from 'react';
import type { DispatchTestResult } from '@/lib/clientPortalApi';
import { resolveCounselorNextTestRecommendation } from '@/lib/counselorNextTestRecommendation';
import { resolveCounselorQuickCareRecommendation } from '@/lib/counselorQuickCareRecommendation';
import {
  isNextTestRecommendationHidden,
  isQuickCareRecommendationHidden,
  restoreNextTestRecommendation,
  restoreQuickCareRecommendation,
} from '@/lib/counselorRecommendCardState';

type DismissedItem = {
  key: string;
  label: string;
  onUndo: () => void;
};

type Props = {
  portalId: string;
  assessmentId: string;
  tests: DispatchTestResult[];
  refreshKey?: number;
  onRestore?: () => void;
};

export default function CounselorRecommendDismissedSummary({
  portalId,
  assessmentId,
  tests,
  refreshKey = 0,
  onRestore,
}: Props) {
  const items = useMemo((): DismissedItem[] => {
    void refreshKey;
    const list: DismissedItem[] = [];
    const next = resolveCounselorNextTestRecommendation(tests);
    if (
      next &&
      assessmentId &&
      isNextTestRecommendationHidden(portalId, assessmentId, next.testId)
    ) {
      list.push({
        key: `next-${next.testId}`,
        label: next.name,
        onUndo: () => {
          restoreNextTestRecommendation(portalId, assessmentId, next.testId);
          onRestore?.();
        },
      });
    }
    const care = resolveCounselorQuickCareRecommendation(tests);
    if (care && isQuickCareRecommendationHidden(portalId, care.presetId)) {
      list.push({
        key: `care-${care.presetId}`,
        label: care.title,
        onUndo: () => {
          restoreQuickCareRecommendation(portalId, care.presetId);
          onRestore?.();
        },
      });
    }
    return list;
  }, [portalId, assessmentId, tests, refreshKey, onRestore]);

  if (items.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-slate-700/35 bg-slate-950/25 px-3 py-2">
      <p className="text-[10px] font-medium tracking-wide text-slate-500">삭제된 추가요청</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-snug text-slate-500"
          >
            <span className="text-slate-400">{item.label}</span>
            <button
              type="button"
              onClick={item.onUndo}
              className="rounded border border-sky-500/30 bg-sky-950/20 px-2 py-0.5 text-[11px] font-medium text-sky-300/95 transition-colors hover:border-sky-400/45 hover:bg-sky-950/40"
            >
              삭제취소
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
