'use client';

import React, { useMemo, useState } from 'react';
import { pushAssessmentsToPortals } from '@/lib/clientPortalApi';
import {
  clearNextTestRecommendationScheduled,
  formatRecommendNotifyStatusText,
  formatScheduleLabel,
  hideNextTestRecommendation,
  isNextTestRecommendationHidden,
  readNextTestRecommendationScheduled,
  writeNextTestRecommendationScheduled,
} from '@/lib/counselorRecommendCardState';
import { resolveCounselorNextTestRecommendation } from '@/lib/counselorNextTestRecommendation';
import type { DispatchRecipient } from '@/lib/clientPortalApi';
import CounselorRecommendCardLayout, {
  recommendDangerButtonClass,
  recommendPrimaryButtonClass,
  recommendSecondaryButtonClass,
} from '@/components/counselor/CounselorRecommendCardLayout';
import CounselorRecommendInlineRow from '@/components/counselor/CounselorRecommendInlineRow';
import CounselorRecommendScheduleDialog from '@/components/counselor/CounselorRecommendScheduleDialog';
import { LoadingSpinner } from '@/components/ui/LoadingMessage';
import { PORTAL_APP_NOTIFY_CHANNELS } from '@/lib/clientPortalNotifyPolicy';

type Props = {
  assessmentId: string;
  recipient: DispatchRecipient;
  onAssigned?: () => void;
  onUiChange?: () => void;
};

export default function CounselorNextTestRecommendCard({
  assessmentId,
  recipient,
  onAssigned,
  onUiChange,
}: Props) {
  const recommendation = useMemo(
    () => resolveCounselorNextTestRecommendation(recipient.tests || []),
    [recipient.tests],
  );

  const [hidden, setHidden] = useState(() =>
    recommendation
      ? isNextTestRecommendationHidden(recipient.portalId, assessmentId, recommendation.testId)
      : false,
  );
  const [scheduled, setScheduled] = useState(() =>
    recommendation
      ? readNextTestRecommendationScheduled(recipient.portalId, assessmentId, recommendation.testId)
      : null,
  );
  const [error, setError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendingHide, setSendingHide] = useState(false);

  const testListed = useMemo(() => {
    if (!recommendation) return false;
    return (recipient.tests || []).some((t) => t.testId === recommendation.testId);
  }, [recipient.tests, recommendation]);

  if (!recommendation) return null;

  const displayTitle = recommendation.name;
  const channels = [...PORTAL_APP_NOTIFY_CHANNELS];

  const handleSend = async (scheduledAt?: string) => {
    setError('');
    setScheduleOpen(false);
    setBusy(true);
    try {
      const result = await pushAssessmentsToPortals({
        portalIds: [recipient.portalId],
        title: `추천 · ${recommendation.name}`,
        welcomeMessage: '담당 상담사가 다음 검사를 안내했습니다. 아래 링크에서 이어서 진행해 주세요.',
        testList: [{ testId: recommendation.testId, name: recommendation.name }],
        notify: true,
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
        writeNextTestRecommendationScheduled(recipient.portalId, assessmentId, recommendation.testId, {
          scheduledAt,
          statusText: snapshot.statusText,
        });
        setScheduled({ scheduledAt, statusText: snapshot.statusText });
        setBusy(false);
      } else {
        clearNextTestRecommendationScheduled(recipient.portalId, assessmentId, recommendation.testId);
        setScheduled(null);
        setSendingHide(true);
        onAssigned?.();
      }
    } catch (err) {
      setSendingHide(false);
      setError(err instanceof Error ? err.message : '검사 보내기에 실패했습니다.');
      setBusy(false);
    }
  };

  const handleDelete = () => {
    hideNextTestRecommendation(recipient.portalId, assessmentId, recommendation.testId);
    setHidden(true);
    setError('');
    onUiChange?.();
  };

  const handleCancelSchedule = () => {
    clearNextTestRecommendationScheduled(recipient.portalId, assessmentId, recommendation.testId);
    setScheduled(null);
  };

  if (hidden) {
    return null;
  }

  if (testListed) {
    return null;
  }

  if (sendingHide) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-950/15 px-4 py-2.5">
        <LoadingSpinner size="sm" />
        <span className="animate-pulse text-sm font-medium text-violet-200/90">보내는 중…</span>
      </div>
    );
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
        accent="violet"
        sectionLabel="다음에 이 검사 1개"
        title={displayTitle}
        error={error}
        actions={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSend()}
              className={`${recommendPrimaryButtonClass('violet')} ${busy ? 'animate-pulse' : ''}`}
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
        <p className="mt-1 text-sm font-medium text-violet-100/90">{recommendation.pitch}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">{recommendation.rationale}</p>
      </CounselorRecommendCardLayout>
      <CounselorRecommendScheduleDialog
        open={scheduleOpen}
        title="검사 예약 보내기"
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
