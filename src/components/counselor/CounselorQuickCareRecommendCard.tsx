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
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import type { NotifyRecipientContact } from '@/lib/counselorNotifyChannels';

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
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressPhase, setProgressPhase] = useState<'idle' | 'loading' | 'success'>('idle');

  const notifyRecipients = useMemo<NotifyRecipientContact[]>(
    () => [
      {
        displayName: recipient.displayName,
        email: recipient.email,
        phone: recipient.phone,
      },
    ],
    [recipient.displayName, recipient.email, recipient.phone],
  );

  if (!recommendation || dismissed || sent) return null;

  const busy = progressPhase !== 'idle';

  const handleSend = async (notifyChannels: ('email' | 'phone')[]) => {
    setError('');
    setConfirmOpen(false);
    setProgressPhase('loading');
    try {
      await createCareAssignments({
        ...buildQuickCareAssignmentInput([recipient.portalId], recommendation),
        notifyChannels,
      });
      setProgressPhase('success');
    } catch (err) {
      setProgressPhase('idle');
      setError(err instanceof Error ? err.message : '숙제 보내기에 실패했습니다.');
    }
  };

  const handleDismiss = () => {
    dismissQuickCareRecommendation(recipient.portalId, recommendation.presetId);
    setDismissed(true);
  };

  const handleProgressConfirm = () => {
    setProgressPhase('idle');
    setSent(true);
    onAssigned?.();
  };

  return (
    <>
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
            onClick={() => setConfirmOpen(true)}
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
      <CounselorNotifyConfirmDialog
        open={confirmOpen}
        kind="care"
        hideChannels
        title="이 숙제 보내기 확인"
        description={`「${recommendation.title}」 숙제를 안내합니다.`}
        recipients={notifyRecipients}
        confirmLabel="보내기"
        onConfirm={(channels) => void handleSend(channels)}
        onCancel={() => {
          if (busy) return;
          setConfirmOpen(false);
        }}
      />
      <CounselorActionProgressOverlay
        open={progressPhase === 'loading'}
        title="숙제 보내기 진행 중…"
        message="잠시만 기다려 주세요."
      />
      <CounselorActionProgressOverlay
        open={progressPhase === 'success'}
        phase="success"
        title="숙제 보내기 완료"
        message="내담자에게 숙제 안내가 발송되었습니다."
        onConfirm={handleProgressConfirm}
      />
    </>
  );
}
