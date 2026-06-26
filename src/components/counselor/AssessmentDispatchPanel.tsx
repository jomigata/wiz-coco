'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCounselorResult, type CounselorResultDetail } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  fetchAssessmentDispatchStatus,
  resendDispatchCredentials,
  sendDispatchTestReminders,
  type AssessmentDispatchStatus,
  type DispatchRecipient,
  type DispatchTestResult,
} from '@/lib/clientPortalApi';

function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

function notifyLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 성공', className: 'text-emerald-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    case 'not_sent':
      return { text: '미발송', className: 'text-slate-500' };
    default:
      return { text: status || '—', className: 'text-slate-400' };
  }
}

function testSummary(r: DispatchRecipient): { text: string; className: string } {
  if (r.testStatus === 'completed') {
    return { text: '검사 완료', className: 'text-emerald-300' };
  }
  if (r.testStatus === 'in_progress') {
    return {
      text: `${r.completedCount}/${r.requiredCount}`,
      className: 'text-amber-300',
    };
  }
  return { text: '미실시', className: 'text-slate-500' };
}

function testStatusLabel(status: DispatchTestResult['status']): { text: string; className: string } {
  switch (status) {
    case 'completed':
      return { text: '완료', className: 'text-emerald-300' };
    case 'in_progress':
      return { text: '진행 중', className: 'text-amber-300' };
    default:
      return { text: '미실시', className: 'text-slate-500' };
  }
}

function canSendReminder(r: DispatchRecipient): boolean {
  if (r.testStatus === 'completed') return false;
  const pending = (r.tests ?? []).some((t) => t.status !== 'completed');
  if (!pending && r.requiredCount > 0) return false;
  return Boolean(r.email || r.phone);
}

interface AssessmentDispatchPanelProps {
  assessmentId: string;
}

export default function AssessmentDispatchPanel({ assessmentId }: AssessmentDispatchPanelProps) {
  const [data, setData] = useState<AssessmentDispatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [resendLoading, setResendLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);
  const [remindOneId, setRemindOneId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(assessmentId);
      setData(result);
      setSelected(new Set());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const allIds = useMemo(
    () => (data?.recipients || []).map((r) => r.portalId),
    [data?.recipients],
  );
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const completedCount = useMemo(
    () => (data?.recipients || []).filter((r) => r.testStatus === 'completed').length,
    [data?.recipients],
  );

  const remindEligibleSelected = useMemo(
    () => (data?.recipients || []).filter((r) => selected.has(r.portalId) && canSendReminder(r)),
    [data?.recipients, selected],
  );

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResend = async () => {
    if (!assessmentId || selected.size === 0) return;
    setResendLoading(true);
    setMessage('');
    try {
      const result = await resendDispatchCredentials(assessmentId, Array.from(selected));
      setMessage(
        `재발송 완료: 성공 ${result.sent}명, 실패 ${result.failed}명, 연락처 없음 ${result.skipped}명 (비밀번호는 새로 발급됩니다)`,
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleRemind = async (portalIds: string[]) => {
    if (!assessmentId || portalIds.length === 0) return;
    const isBulk = portalIds.length > 1;
    if (isBulk) setRemindLoading(true);
    else setRemindOneId(portalIds[0] ?? null);
    setMessage('');
    try {
      const result = await sendDispatchTestReminders(assessmentId, portalIds);
      setMessage(
        `미실시 알림 발송 완료: 성공 ${result.sent}명, 실패 ${result.failed}명, 생략 ${result.skipped}명 (검사 완료·연락처 없음 등)`,
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '미실시 알림 발송에 실패했습니다.');
    } finally {
      setRemindLoading(false);
      setRemindOneId(null);
    }
  };

  const openResultDetail = (resultId: string) => {
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    getCounselorResult(assessmentId, resultId)
      .then(setDetail)
      .catch((err) => setDetailError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setDetailLoading(false));
  };

  const closeModal = () => {
    setDetail(null);
    setDetailError('');
  };

  if (loading) {
    return <p className="text-slate-400 text-sm py-4">발송목록을 불러오는 중…</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (!data) return null;

  const colCount = 9;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-600 bg-slate-800/60 p-4 text-sm text-slate-300 space-y-1">
        <p>
          <span className="text-slate-500">검사코드 </span>
          <span className="font-mono font-semibold text-cyan-300">
            {formatAccessCodeDisplay(data.joinAccessCode)}
          </span>
        </p>
        {data.cohortName ? (
          <p>
            <span className="text-slate-500">기관/단체/그룹명 </span>
            {data.cohortName}
          </p>
        ) : null}
        <p>
          <span className="text-slate-500">검사명 </span>
          {data.title || '—'}
        </p>
        <p className="text-slate-500">
          검사 완료 {completedCount}명 / 전체 {data.recipients.length}명
        </p>
      </div>

      {message ? (
        <p className="text-sm text-slate-300" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">발송목록</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
          <button
            type="button"
            onClick={() => void handleRemind(remindEligibleSelected.map((r) => r.portalId))}
            disabled={
              remindLoading ||
              resendLoading ||
              remindEligibleSelected.length === 0
            }
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            title="미실시 검사자에게 현황·검사 링크 발송 (비밀번호 유지)"
          >
            {remindLoading
              ? '미실시 알림 발송 중…'
              : `선택 미실시 알림 (${remindEligibleSelected.length})`}
          </button>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resendLoading || selected.size === 0}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {resendLoading ? '재발송 중…' : `선택 재발송 (${selected.size})`}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            새로고침
          </button>
        </div>
      </div>

      {data.recipients.length === 0 ? (
        <p className="text-slate-400">발송된 내담자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left w-10">선택</th>
                <th className="px-3 py-2 text-left w-8" aria-label="펼치기" />
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">이메일</th>
                <th className="px-3 py-2 text-left">휴대폰</th>
                <th className="px-3 py-2 text-left">나의코드</th>
                <th className="px-3 py-2 text-left">발송</th>
                <th className="px-3 py-2 text-left">검사</th>
                <th className="px-3 py-2 text-left w-24">미실시 알림</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.recipients.map((r) => {
                const notify = notifyLabel(r.notifyStatus);
                const summary = testSummary(r);
                const isOpen = expanded.has(r.portalId);
                const tests = r.tests ?? [];
                const remindOk = canSendReminder(r);
                const remindingThis = remindOneId === r.portalId;

                return (
                  <React.Fragment key={r.portalId}>
                    <tr className="hover:bg-slate-800/50">
                      <td className="px-3 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={selected.has(r.portalId)}
                          onChange={() => toggleOne(r.portalId)}
                          className="rounded text-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.portalId)}
                          className="text-slate-400 hover:text-white"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? '검사 결과 접기' : '검사 결과 펼치기'}
                        >
                          {isOpen ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-white align-top">{r.displayName || '—'}</td>
                      <td className="px-3 py-2 text-slate-300 align-top">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-300 align-top">{r.phone || '—'}</td>
                      <td className="px-3 py-2 font-mono text-cyan-300 align-top">
                        {formatAccessCodeDisplay(r.myCode)}
                      </td>
                      <td className={`px-3 py-2 align-top ${notify.className}`}>{notify.text}</td>
                      <td className={`px-3 py-2 align-top ${summary.className}`}>{summary.text}</td>
                      <td className="px-3 py-2 align-top">
                        {remindOk ? (
                          <button
                            type="button"
                            onClick={() => void handleRemind([r.portalId])}
                            disabled={remindLoading || resendLoading || remindingThis}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-amber-200 bg-amber-900/40 hover:bg-amber-900/60 disabled:opacity-50"
                            title="미실시 검사 현황·링크를 이메일/SMS로 발송"
                          >
                            {remindingThis ? '…' : '🔔'}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs" title="검사 완료 또는 연락처 없음">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="bg-slate-900/40">
                        <td colSpan={colCount} className="px-3 py-3">
                          {tests.length === 0 ? (
                            <p className="text-slate-500 text-sm pl-6">등록된 검사 항목이 없습니다.</p>
                          ) : (
                            <table className="w-full text-sm ml-6 max-w-3xl">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-700">
                                  <th className="py-1.5 pr-4 text-left font-medium">검사</th>
                                  <th className="py-1.5 pr-4 text-left font-medium w-24">상태</th>
                                  <th className="py-1.5 pr-4 text-left font-medium">완료일시</th>
                                  <th className="py-1.5 text-left font-medium w-24">열람</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tests.map((t) => {
                                  const st = testStatusLabel(t.status);
                                  return (
                                    <tr key={t.testId} className="border-b border-slate-800 last:border-0">
                                      <td className="py-2 pr-4 text-white">{t.testName || t.testId}</td>
                                      <td className={`py-2 pr-4 ${st.className}`}>{st.text}</td>
                                      <td className="py-2 pr-4 text-slate-400">
                                        {formatCompletedAt(t.completedAt)}
                                      </td>
                                      <td className="py-2">
                                        {t.status === 'completed' && t.resultId ? (
                                          <button
                                            type="button"
                                            onClick={() => openResultDetail(t.resultId!)}
                                            className="text-blue-400 hover:text-blue-300"
                                          >
                                            결과 보기
                                          </button>
                                        ) : (
                                          <span className="text-slate-600">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500">
        행 왼쪽 ▶ 를 눌러 검사별 결과를 확인할 수 있습니다. 미실시 알림은 미완료 검사 현황과 검사
        링크만 발송하며 비밀번호는 변경되지 않습니다. 재발송 시 비밀번호가 새로 발급됩니다.
      </p>

      {(detail !== null || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !detailLoading && closeModal()}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">검사 결과 상세</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {detailLoading && <p className="text-slate-400">불러오는 중…</p>}
              {detailError && <p className="text-red-400 text-sm">{detailError}</p>}
              {detail && !detailLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-slate-400">내담자</span>
                    <span className="text-white">{detail.clientDisplayName || detail.clientEmail || '—'}</span>
                    <span className="text-slate-400">검사</span>
                    <span className="text-white">{detail.testId}</span>
                    <span className="text-slate-400">완료일시</span>
                    <span className="text-slate-300">{formatCompletedAt(detail.completedAt)}</span>
                  </div>
                  {detail.resultData && Object.keys(detail.resultData).length > 0 && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">채점/요약</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.resultData, null, 2)}
                      </pre>
                    </div>
                  )}
                  {detail.responses != null && (
                    <div>
                      <h4 className="text-slate-400 text-sm font-medium mb-2">응답</h4>
                      <pre className="bg-slate-900/80 rounded-lg p-3 text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(detail.responses, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
