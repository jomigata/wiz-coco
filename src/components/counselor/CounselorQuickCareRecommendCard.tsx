'use client';

import React, { useMemo, useState } from 'react';
import { createCareAssignments } from '@/lib/careAssignmentApi';
import type { DispatchRecipient } from '@/lib/clientPortalApi';
import {
  buildQuickCareAssignmentInput,
  resolveCounselorQuickCareRecommendation,
} from '@/lib/counselorQuickCareRecommendation';
import {
  clearQuickCareRecommendationSent,
  formatRecommendNotifyStatusText,
  hideQuickCareRecommendation,
  isQuickCareRecommendationHidden,
  readQuickCareRecommendationSent,
  restoreQuickCareRecommendation,
  writeQuickCareRecommendationSent,
  type RecommendCardSentSnapshot,
} from '@/lib/counselorRecommendCardState';
import CounselorNotifyConfirmDialog from '@/components/counselor/CounselorNotifyConfirmDialog';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorRecommendCardLayout, {
  recommendDangerButtonClass,
  recommendPrimaryButtonClass,
  recommendSecondaryButtonClass,
} from '@/components/counselor/CounselorRecommendCardLayout';
import CounselorRecommendScheduleDialog from '@/components/counselor/CounselorRecommendScheduleDialog';
import type { NotifyRecipientContact } from '@/lib/counselorNotifyChannels';
import { PORTAL_APP_NOTIFY_CHANNELS } from '@/lib/clientPortalNotifyPolicy';

type Props = {
  recipient: DispatchRecipient;
  onAssigned?: () => void;
};

export default function CounselorQuickCareRecommendCard({ recipient, onAssigned }: Props) {
  const recommendation = useMemo(
    () => resolveCounselorQuickCareRecommendation(recipient.tests || []),
    [recipient.tests],
  );

  const [hidden, setHidden] = useState(() =>
    recommendation ? isQuickCareRecommendationHidden(recipient.portalId, recommendation.presetId) : false,
  );
  const [sentSnapshot, setSentSnapshot] = useState<RecommendCardSentSnapshot | null>(() =>
    recommendation ? readQuickCareRecommendationSent(recipient.portalId, recommendation.presetId) : null,
  );
  const [error, setError] = useState('');
  const [immediateConfirmOpen, setImmediateConfirmOpen] = useState(false);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingScheduleIso, setPendingScheduleIso] = useState<string | null>(null);
  const [progressPhase, setProgressPhase] = useState<'idle' | 'loading' | 'success'>('idle');

  const notifyRecipients = useMemo<NotifyRecipientContact[]>(
    () => [
      {
        displayName: recipient.displayName,
        myCode: recipient.myCode,
        phone: recipient.phone,
      },
    ],
    [recipient.displayName, recipient.myCode, recipient.phone],
  );

  if (!recommendation) return null;

  const busy = progressPhase !== 'idle';
  const displayTitle = recommendation.title;

  const persistSent = (snapshot: RecommendCardSentSnapshot) => {
    writeQuickCareRecommendationSent(recipient.portalId, recommendation.presetId, snapshot);
    setSentSnapshot(snapshot);
    setHidden(false);
  };

  const handleSend = async (notifyChannels: ('email' | 'phone' | 'app')[], scheduledAt?: string) => {
    setError('');
    setImmediateConfirmOpen(false);
    setScheduleConfirmOpen(false);
    setScheduleOpen(false);
    setPendingScheduleIso(null);
    setProgressPhase('loading');
    try {
      const result = await createCareAssignments({
        ...buildQuickCareAssignmentInput([recipient.portalId], recommendation),
        notifyChannels,
        scheduledAt,
      });
      const snapshot = formatRecommendNotifyStatusText({
        scheduledAt,
        notifySent: result.notify?.sent,
        notifyFailed: result.notify?.failed,
        appOnly: notifyChannels.includes('app') && !notifyChannels.includes('phone'),
      });
      persistSent(snapshot);
      setProgressPhase('success');
    } catch (err) {
      setProgressPhase('idle');
      setError(err instanceof Error ? err.message : '숙제 보내기에 실패했습니다.');
    }
  };

  const handleDelete = () => {
    hideQuickCareRecommendation(recipient.portalId, recommendation.presetId);
    setHidden(true);
    setError('');
  };

  const handleRestore = () => {
    restoreQuickCareRecommendation(recipient.portalId, recommendation.presetId);
    clearQuickCareRecommendationSent(recipient.portalId, recommendation.presetId);
    setHidden(false);
    setSentSnapshot(null);
    setError('');
  };

  const handleProgressConfirm = () => {
    setProgressPhase('idle');
    onAssigned?.();
  };

  if (hidden) {
    return (
      <CounselorRecommendCardLayout
        accent="teal"
        sectionLabel="짧은 숙제 1개"
        title={displayTitle}
        compact
        onRestore={handleRestore}
      />
    );
  }

  if (sentSnapshot) {
    return (
      <>
        <CounselorRecommendCardLayout
          accent="teal"
          sectionLabel="짧은 숙제 1개"
          title={displayTitle}
          compact
          statusText={sentSnapshot.statusText}
          statusClassName={sentSnapshot.statusClassName}
          onRestore={handleRestore}
        />
        <CounselorActionProgressOverlay
          open={progressPhase === 'success'}
          phase="success"
          title={sentSnapshot.scheduledAt ? '예약 등록 완료' : '숙제 보내기 완료'}
          message={
            sentSnapshot.scheduledAt
              ? '예약 시각에 내담자에게 알림이 발송됩니다.'
              : '내담자 내 검사실 앱으로 숙제 안내가 전달되었습니다.'
          }
          onConfirm={handleProgressConfirm}
        />
      </>
    );
  }

  return (
    <>
      <CounselorRecommendCardLayout
        accent="teal"
        sectionLabel="짧은 숙제 1개"
        title={displayTitle}
        error={error}
        actions={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => setImmediateConfirmOpen(true)}
              className={recommendPrimaryButtonClass('teal')}
            >
              {busy ? '보내는 중…' : '즉시 발송'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setScheduleOpen(true)}
              className={recommendSecondaryButtonClass()}
            >
              예약 보내기
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleDelete}
              className={recommendDangerButtonClass()}
            >
              삭제
            </button>
          </>
        }
      >
        <p className="mt-2 text-sm text-slate-300">{recommendation.pitch}</p>
        <p className="mt-1 text-xs text-slate-500">{recommendation.rationale}</p>
      </CounselorRecommendCardLayout>
      <CounselorNotifyConfirmDialog
        open={immediateConfirmOpen}
        kind="care"
        hideChannels
        title="즉시 발송 확인"
        description={`「${recommendation.title}」 숙제를 지금 안내합니다.`}
        recipients={notifyRecipients}
        confirmLabel="즉시 발송"
        onConfirm={(channels) =>
          void handleSend(channels.length ? channels : [...PORTAL_APP_NOTIFY_CHANNELS])
        }
        onCancel={() => {
          if (busy) return;
          setImmediateConfirmOpen(false);
        }}
      />
      <CounselorRecommendScheduleDialog
        open={scheduleOpen}
        title="숙제 예약 보내기"
        onCancel={() => {
          if (busy) return;
          setScheduleOpen(false);
        }}
        onConfirm={(iso) => {
          setPendingScheduleIso(iso);
          setScheduleOpen(false);
          setScheduleConfirmOpen(true);
        }}
      />
      <CounselorNotifyConfirmDialog
        open={scheduleConfirmOpen}
        kind="care"
        hideChannels
        title="예약 보내기 확인"
        description={`「${recommendation.title}」 숙제 안내를 예약합니다.`}
        recipients={notifyRecipients}
        confirmLabel="예약 등록"
        onConfirm={(channels) =>
          void handleSend(
            channels.length ? channels : [...PORTAL_APP_NOTIFY_CHANNELS],
            pendingScheduleIso || undefined,
          )
        }
        onCancel={() => {
          if (busy) return;
          setScheduleConfirmOpen(false);
          setPendingScheduleIso(null);
        }}
      />
      <CounselorActionProgressOverlay
        open={progressPhase === 'loading'}
        title="숙제 보내기 진행 중…"
        message="잠시만 기다려 주세요."
      />
    </>
  );
}
