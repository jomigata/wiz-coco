'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  filterCounselorAssessmentsForPortalMove,
  listAssessments,
} from '@/lib/assessmentApi';
import { movePortalsToAssessment } from '@/lib/clientPortalApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';

type Props = {
  open: boolean;
  portalIds: string[];
  sourceAssessmentId?: string;
  onClose: () => void;
  onSuccess: (summary: string) => void;
};

export default function CounselorPortalMoveDialog({
  open,
  portalIds,
  sourceAssessmentId,
  onClose,
  onSuccess,
}: Props) {
  const { user } = useAuthResolved();
  const counselorUid = user?.uid;
  const [targetAssessmentId, setTargetAssessmentId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<
    { id: string; title: string; accessCode: string }[]
  >([]);

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
      setOptions(
        filtered.map((a) => ({
          id: a.id,
          title: (a.title || '제목 없음').trim(),
          accessCode: a.accessCode || '',
        })),
      );
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

  if (!open) return null;

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
      onSuccess(
        `이동 ${result.moved}건 · 생략 ${result.skipped}건 · 실패 ${result.failed}건 · 검사결과 ${result.resultsUpdated}건 연결 · 중복 ${result.resultsDeleted ?? 0}건 삭제`,
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '상담코드 이동에 실패했습니다.');
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
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#0f1a2e] p-5 shadow-xl"
      >
        <h2 id="move-portal-title" className="text-base font-semibold text-white">
          다른 상담코드로 이동
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          선택한 {portalIds.length}명을 지정한 상담코드로 완전 이동합니다. 기존 상담코드에서는 제거되며
          알림은 발송하지 않습니다.
        </p>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <label className="mt-4 block text-sm text-slate-300">
          <span className="mb-1 block">대상 상담코드 (내가 생성한 코드만 표시)</span>
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
                {a.title} · {formatAccessCodeDisplay(a.accessCode)}
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
    </div>
  );
}
