'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  const [sendPendingUntilListed, setSendPendingUntilListed] = useState(false);

  const testListed = useMemo(() => {
    if (!recommendation) return false;
    return (recipient.tests || []).some((t) => t.testId === recommendation.testId);
  }, [recipient.tests, recommendation]);

  useEffect(() => {
    if (testListed && sendPendingUntilListed) {
      setSendPendingUntilListed(false);
      setBusy(false);
    }
  }, [testListed, sendPendingUntilListed]);

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
        assessmentId,
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
        setSendPendingUntilListed(true);
        onAssigned?.();
      }
    } catch (err) {
      setSendPendingUntilListed(false);
      setError(err instanceof Error ? err.message : '검사 추가에 실패했습니다.');
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

  const sendingImmediate = busy || sendPendingUntilListed;

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
              disabled={sendingImmediate}
              onClick={() => void handleSend()}
              className={`${recommendPrimaryButtonClass('violet')} inline-flex items-center justify-center gap-1.5 ${sendingImmediate ? 'animate-pulse' : ''}`}
            >
              {sendingImmediate ? (
                <>
                  <LoadingSpinner size="sm" className="h-3.5 w-3.5 border-[1.5px]" />
                  추가 중…
                </>
              ) : (
                '즉시 추가'
              )}
            </button>
            <button
              type="button"
              disabled={sendingImmediate}
              onClick={() => setScheduleOpen(true)}
              className={recommendSecondaryButtonClass()}
            >
              예약 보내기
            </button>
            <button
              type="button"
              disabled={sendingImmediate}
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
