'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  filterCounselorAssessmentsForPortalMove,
  listAssessments,
  writePortalMoveBanner,
  type CounselorAssessment,
} from '@/lib/assessmentApi';
import { formatPortalMoveAssessmentLabel } from '@/lib/counselorAssessmentResultDisplay';
import { movePortalsToAssessment } from '@/lib/clientPortalApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';

export type PortalMoveSummary = {
  portalId: string;
  displayName: string;
  myCode?: string;
};

type Props = {
  open: boolean;
  portalIds: string[];
  portalSummaries?: PortalMoveSummary[];
  sourceAssessmentId?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CounselorPortalMoveDialog({
  open,
  portalIds,
  portalSummaries = [],
  sourceAssessmentId,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { user } = useAuthResolved();
  const counselorUid = user?.uid;
  const [targetAssessmentId, setTargetAssessmentId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [moveComplete, setMoveComplete] = useState<{ message: string; error?: boolean } | null>(
    null,
  );
  const [options, setOptions] = useState<CounselorAssessment[]>([]);

  const loadOptions = useCallback(async () => {
    if (!counselorUid) return;
    setLoadingOptions(true);
    setError('');
    try {
      const data = await listAssessments();
      const filtered = filterCounselorAssessmentsForPortalMove(
        data.assessments || [],
        counselorUid,
        { excludeAssessmentId: sourceAssessmentId },
      );
      setOptions(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : '상담코드 목록을 불러오지 못했습니다.');
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [counselorUid, sourceAssessmentId]);

  useEffect(() => {
    if (!open) {
      setTargetAssessmentId('');
      setError('');
      return;
    }
    void loadOptions();
  }, [open, loadOptions]);

  const handleMoveCompleteConfirm = () => {
    const hadError = moveComplete?.error;
    setMoveComplete(null);
    if (hadError) return;
    onClose();
    onSuccess?.();
    pushWithAuthSession(router, '/counselor/assessments?moved=1');
    router.refresh();
  };

  if (!open && !moveComplete) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssessmentId) {
      setError('이동할 상담코드를 선택해 주세요.');
      return;
    }
    if (portalIds.length === 0) {
      setError('이동할 내담자를 선택해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await movePortalsToAssessment({
        portalIds,
        targetAssessmentId,
        sourceAssessmentId,
      });
      const target = options.find((a) => a.id === targetAssessmentId);
      const summaryById = new Map(portalSummaries.map((s) => [s.portalId, s]));
      const movedDetails = (result.details || []).filter((d) => d.status === 'moved');
      const recipients = movedDetails.map((d) => {
        const row = summaryById.get(d.portalId);
        return {
          displayName: (d.displayName || row?.displayName || '—').trim() || '—',
          myCode: row?.myCode,
        };
      });
      writePortalMoveBanner({
        moved: result.moved,
        targetAssessmentTitle: result.targetAssessmentTitle || target?.title || '상담코드',
        targetAccessCode: target?.accessCode || '',
        targetCohortName: target?.cohortName,
        recipients,
      });
      setMoveComplete({
        message: `이동 ${result.moved}명${result.failed ? `, 실패 ${result.failed}명` : ''}`,
      });
    } catch (err) {
      setMoveComplete({
        message: err instanceof Error ? err.message : '상담코드 이동에 실패했습니다.',
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-portal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border-2 border-sky-400/55 bg-[#0f1a2e] p-5 shadow-2xl ring-1 ring-white/15"
      >
        <h2 id="move-portal-title" className="text-base font-semibold text-white">
          다른 상담코드로 이동
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          선택한 {portalIds.length}명을 선택한 상담코드로 완전 이동합니다.
        </p>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <label className="mt-4 block text-sm text-slate-300">
          <span className="mb-1 block">이동할 상담코드</span>
          <select
            value={targetAssessmentId}
            onChange={(e) => setTargetAssessmentId(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#101f38]/90 px-2 py-2 text-sm text-white"
            disabled={loadingOptions || busy || !counselorUid}
            required
          >
            <option value="">
              {loadingOptions ? '불러오는 중…' : '상담코드를 선택하세요'}
            </option>
            {options.map((a) => (
              <option key={a.id} value={a.id}>
                {formatPortalMoveAssessmentLabel(a)}
              </option>
            ))}
          </select>
        </label>

        {!loadingOptions && options.length === 0 && counselorUid ? (
          <p className="mt-2 text-xs text-amber-300/90">이동 가능한 다른 상담코드가 없습니다.</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
            disabled={busy}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy || loadingOptions || options.length === 0}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? '처리 중…' : '이동'}
          </button>
        </div>
      </form>
      <CounselorActionProgressOverlay
        open={busy}
        zIndexClass="z-[60]"
        title="이동 진행 중…"
        message={`선택 ${portalIds.length}명을 다른 상담코드로 이동하고 있습니다.`}
      />
      <CounselorActionCompleteModal
        open={Boolean(moveComplete)}
        title={moveComplete?.error ? '이동 실패' : '이동 완료'}
        message={moveComplete?.message}
        error={moveComplete?.error}
        onConfirm={handleMoveCompleteConfirm}
        zIndexClass="z-[70]"
      />
    </div>
  );
}
