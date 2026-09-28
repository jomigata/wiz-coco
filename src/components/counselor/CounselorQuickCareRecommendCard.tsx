'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createCareAssignments, listCareAssignments } from '@/lib/careAssignmentApi';
import type { DispatchRecipient } from '@/lib/clientPortalApi';
import {
  buildQuickCareAssignmentInput,
  resolveCounselorQuickCareRecommendation,
} from '@/lib/counselorQuickCareRecommendation';
import {
  clearQuickCareRecommendationScheduled,
  formatRecommendNotifyStatusText,
  formatScheduleLabel,
  hideQuickCareRecommendation,
  isQuickCareRecommendationHidden,
  readQuickCareRecommendationScheduled,
  writeQuickCareRecommendationScheduled,
} from '@/lib/counselorRecommendCardState';
import CounselorRecommendCardLayout, {
  recommendDangerButtonClass,
  recommendPrimaryButtonClass,
  recommendSecondaryButtonClass,
} from '@/components/counselor/CounselorRecommendCardLayout';
import CounselorRecommendInlineRow from '@/components/counselor/CounselorRecommendInlineRow';
import CounselorRecommendScheduleDialog from '@/components/counselor/CounselorRecommendScheduleDialog';
import { PORTAL_APP_NOTIFY_CHANNELS } from '@/lib/clientPortalNotifyPolicy';

type Props = {
  recipient: DispatchRecipient;
  onAssigned?: () => void;
  careListRefresh?: number;
  onUiChange?: () => void;
};

export default function CounselorQuickCareRecommendCard({
  recipient,
  onAssigned,
  careListRefresh = 0,
  onUiChange,
}: Props) {
  const recommendation = useMemo(
    () => resolveCounselorQuickCareRecommendation(recipient.tests || []),
    [recipient.tests],
  );

  const [hidden, setHidden] = useState(() =>
    recommendation ? isQuickCareRecommendationHidden(recipient.portalId, recommendation.presetId) : false,
  );
  const [scheduled, setScheduled] = useState(() =>
    recommendation
      ? readQuickCareRecommendationScheduled(recipient.portalId, recommendation.presetId)
      : null,
  );
  const [alreadyAssigned, setAlreadyAssigned] = useState(false);
  const [error, setError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!recommendation || !recipient.portalId) return;
    let cancelled = false;
    void listCareAssignments({ portalId: recipient.portalId, status: 'active', limit: 40 })
      .then((data) => {
        if (cancelled) return;
        const title = recommendation.title.trim();
        setAlreadyAssigned(
          (data.items || []).some((item) => (item.title || '').trim() === title),
        );
      })
      .catch(() => {
        if (!cancelled) setAlreadyAssigned(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipient.portalId, recommendation?.title, recommendation?.presetId, careListRefresh]);

  if (!recommendation) return null;
  if (alreadyAssigned && !scheduled && !hidden) return null;

  const displayTitle = recommendation.title;
  const channels = [...PORTAL_APP_NOTIFY_CHANNELS];

  const handleSend = async (scheduledAt?: string) => {
    setError('');
    setScheduleOpen(false);
    setBusy(true);
    try {
      const result = await createCareAssignments({
        ...buildQuickCareAssignmentInput([recipient.portalId], recommendation),
        notifyChannels: channels,
        scheduledAt,
      });
      if (scheduledAt) {
        const snapshot = formatRecommendNotifyStatusText({
          scheduledAt,
          notifySent: result.notify?.sent,
          notifyFailed: result.notify?.failed,
          appOnly: true,
        });
        writeQuickCareRecommendationScheduled(recipient.portalId, recommendation.presetId, {
          scheduledAt,
          statusText: snapshot.statusText,
        });
        setScheduled({ scheduledAt, statusText: snapshot.statusText });
      } else {
        clearQuickCareRecommendationScheduled(recipient.portalId, recommendation.presetId);
        setScheduled(null);
        setAlreadyAssigned(true);
        onAssigned?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '숙제 보내기에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = () => {
    hideQuickCareRecommendation(recipient.portalId, recommendation.presetId);
    setHidden(true);
    setError('');
    onUiChange?.();
  };

  const handleCancelSchedule = () => {
    clearQuickCareRecommendationScheduled(recipient.portalId, recommendation.presetId);
    setScheduled(null);
  };

  if (hidden) {
    return null;
  }

  if (scheduled) {
    return (
      <CounselorRecommendInlineRow
        title={displayTitle}
        detail={scheduled.statusText || `예약 · ${formatScheduleLabel(scheduled.scheduledAt)}`}
        actionLabel="예약취소"
        onAction={handleCancelSchedule}
      />
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
              onClick={() => void handleSend()}
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
      <CounselorRecommendScheduleDialog
        open={scheduleOpen}
        title="숙제 예약 보내기"
        onCancel={() => {
          if (busy) return;
          setScheduleOpen(false);
        }}
        onConfirm={(iso) => {
          void handleSend(iso);
        }}
      />
    </>
  );
}
