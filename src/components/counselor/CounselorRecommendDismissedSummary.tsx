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

/** `- 삭제된 추가요청건 : 검사명 (삭제취소), …` */
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
    <p className="mt-2 text-sm font-normal leading-snug text-slate-300">
      <span className="text-slate-400">- 삭제된 추가요청건 : </span>
      {items.map((item, index) => (
        <span key={item.key}>
          {index > 0 ? ', ' : null}
          <span>{item.label}</span>{' '}
          <button
            type="button"
            onClick={item.onUndo}
            className="inline text-[11px] font-normal text-slate-500 underline-offset-2 hover:text-sky-300 hover:underline"
          >
            (삭제취소)
          </button>
        </span>
      ))}
    </p>
  );
}
