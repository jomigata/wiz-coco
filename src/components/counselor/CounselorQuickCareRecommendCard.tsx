'use client';

import React, { useMemo, useState } from 'react';
import { createCareAssignments } from '@/lib/careAssignmentApi';
import type { DispatchRecipient } from '@/lib/clientPortalApi';
import {
  buildQuickCareAssignmentInput,
  dismissQuickCareRecommendation,
  isQuickCareRecommendationDismissed,
  resolveCounselorQuickCareRecommendation,
} from '@/lib/counselorQuickCareRecommendation';

type Props = {
  recipient: DispatchRecipient;
  onAssigned?: () => void;
};

export default function CounselorQuickCareRecommendCard({ recipient, onAssigned }: Props) {
  const recommendation = useMemo(
    () => resolveCounselorQuickCareRecommendation(recipient.tests || []),
    [recipient.tests],
  );

  const [dismissed, setDismissed] = useState(() =>
    recommendation
      ? isQuickCareRecommendationDismissed(recipient.portalId, recommendation.presetId)
      : false,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (!recommendation || dismissed || sent) return null;

  const handleSend = async () => {
    setBusy(true);
    setError('');
    try {
      await createCareAssignments(
        buildQuickCareAssignmentInput([recipient.portalId], recommendation),
      );
      setSent(true);
      onAssigned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '숙제 보내기에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    dismissQuickCareRecommendation(recipient.portalId, recommendation.presetId);
    setDismissed(true);
  };

  return (
    <div className="mt-3 rounded-xl border border-teal-500/30 bg-teal-950/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-200/90">짧은 숙제 1개</p>
      <p className="mt-1 text-sm font-medium text-white">{recommendation.title}</p>
      <p className="mt-2 text-sm text-slate-300">{recommendation.pitch}</p>
      <p className="mt-1 text-xs text-slate-500">{recommendation.rationale}</p>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSend()}
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {busy ? '보내는 중…' : '이 숙제 보내기'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDismiss}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
