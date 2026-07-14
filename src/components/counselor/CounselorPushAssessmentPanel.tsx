'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listAssessments, type CounselorAssessment } from '@/lib/assessmentApi';
import { pushAssessmentsToPortals } from '@/lib/clientPortalApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';

type PushMode = 'existing' | 'new';

type Props = {
  portalIds: string[];
  assignedAssessmentIds?: string[];
  onSuccess?: () => void;
};

export default function CounselorPushAssessmentPanel({
  portalIds,
  assignedAssessmentIds = [],
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PushMode>('existing');
  const [assessments, setAssessments] = useState<CounselorAssessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [title, setTitle] = useState('추가 검사');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  const assignedSet = useMemo(() => new Set(assignedAssessmentIds), [assignedAssessmentIds]);

  const loadAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    try {
      const data = await listAssessments();
      const individual = (data.assessments || []).filter(
        (a) => (a.issueType || 'individual') === 'individual' && (a.status || 'active') === 'active',
      );
      setAssessments(individual);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사코드 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingAssessments(false);
    }
  }, []);

  useEffect(() => {
    if (open && mode === 'existing' && assessments.length === 0) {
      void loadAssessments();
    }
  }, [open, mode, assessments.length, loadAssessments]);

  const availableAssessments = useMemo(
    () => assessments.filter((a) => !assignedSet.has(a.id)),
    [assessments, assignedSet],
  );

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResultMsg('');

    try {
      const payload =
        mode === 'existing'
          ? {
              portalIds,
              assessmentId: selectedAssessmentId,
              notify,
            }
          : {
              portalIds,
              title: title.trim(),
              welcomeMessage: welcomeMessage.trim(),
              usageEndDate: usageEndDate.trim(),
              testList: counselorAssessmentTestOptions
                .filter((t) => selectedTestIds.has(t.testId))
                .map((t) => ({ testId: t.testId, name: t.name })),
              notify,
            };

      if (mode === 'existing' && !selectedAssessmentId) {
        setError('검사코드를 선택해 주세요.');
        return;
      }
      if (mode === 'new') {
        if (!title.trim()) {
          setError('검사코드 제목을 입력해 주세요.');
          return;
        }
        if (selectedTestIds.size === 0) {
          setError('포함할 검사를 1개 이상 선택해 주세요.');
          return;
        }
      }

      const result = await pushAssessmentsToPortals(payload);
      setResultMsg(
        `배정 ${result.assigned}건 · 생략 ${result.skipped}건 · 실패 ${result.failed}건 · 알림 발송 ${result.notify.sent}건`,
      );
      onSuccess?.();
      if (result.assigned > 0) {
        setOpen(false);
        setSelectedAssessmentId('');
        setSelectedTestIds(new Set());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가 검사 push에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (portalIds.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-white">추가 검사 push</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {portalIds.length}명 내담자에게 검사코드를 추가 배정하고 알림을 보냅니다.
          </p>
        </div>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      {open ? (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === 'existing'
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              기존 검사코드
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === 'new'
                  ? 'bg-sky-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              신규 검사코드 생성
            </button>
          </div>

          {mode === 'existing' ? (
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">검사코드 선택</label>
              {loadingAssessments ? (
                <p className="text-xs text-slate-500">검사코드 목록 불러오는 중…</p>
              ) : availableAssessments.length === 0 ? (
                <p className="text-xs text-amber-300">
                  배정 가능한 기존 검사코드가 없습니다. 신규 검사코드를 생성해 주세요.
                </p>
              ) : (
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">검사코드를 선택하세요</option>
                  {availableAssessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({(a.testList || []).length}개 검사)
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">검사코드 제목</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="예: 2차 추가 검사"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">포함 검사</label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {counselorAssessmentTestOptions.map((t) => (
                    <label
                      key={t.testId}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-slate-200 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTestIds.has(t.testId)}
                        onChange={() => toggleTest(t.testId)}
                        className="rounded border-slate-300"
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">안내 메시지 (선택)</label>
                  <input
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">사용 종료일 (선택)</label>
                  <input
                    type="date"
                    value={usageEndDate}
                    onChange={(e) => setUsageEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="rounded border-slate-300"
            />
            내담자에게 이메일/SMS 알림 발송
          </label>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          {resultMsg ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
              {resultMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? '배정 중…' : '추가 검사 push 실행'}
          </button>
        </form>
      ) : null}
    </section>
  );
}
