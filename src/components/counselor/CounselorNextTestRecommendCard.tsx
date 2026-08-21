'use client';

import React, { useMemo, useState } from 'react';
import { pushAssessmentsToPortals } from '@/lib/clientPortalApi';
import {
  dismissNextTestRecommendation,
  isNextTestRecommendationDismissed,
  resolveCounselorNextTestRecommendation,
  type CounselorNextTestRecommendation,
} from '@/lib/counselorNextTestRecommendation';
import type { DispatchRecipient } from '@/lib/clientPortalApi';

type Props = {
  assessmentId: string;
  recipient: DispatchRecipient;
  onAssigned?: () => void;
};

export default function CounselorNextTestRecommendCard({
  assessmentId,
  recipient,
  onAssigned,
}: Props) {
  const recommendation = useMemo(
    () => resolveCounselorNextTestRecommendation(recipient.tests || []),
    [recipient.tests],
  );

  const [dismissed, setDismissed] = useState(() =>
    recommendation
      ? isNextTestRecommendationDismissed(recipient.portalId, assessmentId, recommendation.testId)
      : false,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (!recommendation || dismissed || sent) return null;

  const handleSend = async (item: CounselorNextTestRecommendation) => {
    setBusy(true);
    setError('');
    try {
      await pushAssessmentsToPortals({
        portalIds: [recipient.portalId],
        title: `추천 · ${item.name}`,
        welcomeMessage: '담당 상담사가 다음 검사를 안내했습니다. 아래 링크에서 이어서 진행해 주세요.',
        testList: [{ testId: item.testId, name: item.name }],
        notify: true,
      });
      setSent(true);
      onAssigned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 보내기에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    dismissNextTestRecommendation(recipient.portalId, assessmentId, recommendation.testId);
    setDismissed(true);
  };

  return (
    <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-950/25 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-300/90">
        다음에 이 검사 1개
      </p>
      <p className="mt-1 text-sm font-medium text-white">{recommendation.pitch}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{recommendation.rationale}</p>
      <p className="mt-2 text-sm text-violet-200">
        추천: <span className="font-semibold text-white">{recommendation.name}</span>
      </p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSend(recommendation)}
          className="rounded-md bg-violet-600/90 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50 sm:text-sm"
        >
          {busy ? '보내는 중…' : '이 검사 보내기'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDismiss}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 sm:text-sm"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
