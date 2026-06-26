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

function testLetterLabel(index: number): string {
  return `${String.fromCharCode(97 + index)}.`;
}

type RecipientSortKey = 'displayName' | 'email' | 'phone' | 'myCode' | 'notifyStatus' | 'testStatus';
type SortDirection = 'asc' | 'desc';

function testStatusOrder(status: DispatchRecipient['testStatus']): number {
  if (status === 'completed') return 2;
  if (status === 'in_progress') return 1;
  return 0;
}

function compareRecipients(
  a: DispatchRecipient,
  b: DispatchRecipient,
  key: RecipientSortKey,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'displayName':
      return mult * (a.displayName || '').localeCompare(b.displayName || '', 'ko');
    case 'email':
      return mult * (a.email || '').localeCompare(b.email || '', 'ko');
    case 'phone':
      return mult * (a.phone || '').localeCompare(b.phone || '', 'ko');
    case 'myCode':
      return mult * (a.myCode || '').localeCompare(b.myCode || '', 'ko');
    case 'notifyStatus':
      return mult * (a.notifyStatus || '').localeCompare(b.notifyStatus || '', 'ko');
    case 'testStatus':
      return mult * (testStatusOrder(a.testStatus) - testStatusOrder(b.testStatus));
    default:
      return 0;
  }
}

function SortableColumnHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: RecipientSortKey;
  activeKey: RecipientSortKey | null;
  direction: SortDirection;
  onSort: (key: RecipientSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={`px-3 py-2 text-left text-xs font-medium text-slate-400 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-slate-600'}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

function contactChannels(r: DispatchRecipient): string {
  const parts: string[] = [];
  if (r.email) parts.push(`이메일 (${r.email})`);
  if (r.phone) parts.push(`SMS (${r.phone})`);
  return parts.length > 0 ? parts.join(', ') : '없음';
}

function pendingTestsFor(r: DispatchRecipient): DispatchTestResult[] {
  return (r.tests ?? []).filter((t) => t.status !== 'completed');
}

function skipRemindReason(r: DispatchRecipient): string {
  if (r.testStatus === 'completed') return '검사 완료';
  if (!pendingTestsFor(r).length && r.requiredCount > 0) return '미완료 검사 없음';
  if (!r.email && !r.phone) return '연락처 없음';
  return '발송 불가';
}

type BulkConfirmAction = 'remind' | 'resend' | null;
type DispatchProgress = { kind: 'remind' | 'resend'; count: number };

interface AssessmentDispatchPanelProps {
  assessmentId: string;
}

export default function AssessmentDispatchPanel({ assessmentId }: AssessmentDispatchPanelProps) {
  const [data, setData] = useState<AssessmentDispatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkConfirmAction>(null);
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgress | null>(null);
  const [sortKey, setSortKey] = useState<RecipientSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [message, setMessage] = useState('');

  const [detail, setDetail] = useState<CounselorResultDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!assessmentId) return;
    if (!opts?.silent) setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(assessmentId);
      setData(result);
      setSelected(new Set());
    } catch (err) {
      if (!opts?.silent) setData(null);
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      if (!opts?.silent) setLoading(false);
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

  const selectedRecipients = useMemo(
    () => (data?.recipients || []).filter((r) => selected.has(r.portalId)),
    [data?.recipients, selected],
  );

  const resendEligibleSelected = useMemo(
    () => selectedRecipients.filter((r) => r.email || r.phone),
    [selectedRecipients],
  );

  const resendSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !r.email && !r.phone),
    [selectedRecipients],
  );

  const remindSkippedSelected = useMemo(
    () => selectedRecipients.filter((r) => !canSendReminder(r)),
    [selectedRecipients],
  );

  const loginUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portal/login/`
      : 'https://wizcoco.com/portal/login/';

  const sortedRecipients = useMemo(() => {
    const list = [...(data?.recipients || [])];
    if (!sortKey) return list;
    list.sort((a, b) => compareRecipients(a, b, sortKey, sortDir));
    return list;
  }, [data?.recipients, sortKey, sortDir]);

  const toggleSort = (key: RecipientSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

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
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleResend = async () => {
    if (!assessmentId || selected.size === 0) return;
    const count = resendEligibleSelected.length || selected.size;
    setDispatchProgress({ kind: 'resend', count });
    setResendLoading(true);
    setMessage('');
    try {
      const result = await resendDispatchCredentials(assessmentId, Array.from(selected));
      setMessage(
        `재발송 완료: 성공 ${result.sent}명, 실패 ${result.failed}명, 연락처 없음 ${result.skipped}명 (비밀번호는 새로 발급됩니다)`,
      );
      await load({ silent: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    } finally {
      setResendLoading(false);
      setDispatchProgress(null);
    }
  };

  const handleRemind = async (portalIds: string[]) => {
    if (!assessmentId || portalIds.length === 0) return;
    setDispatchProgress({ kind: 'remind', count: portalIds.length });
    setRemindLoading(true);
    setMessage('');
    try {
      const result = await sendDispatchTestReminders(assessmentId, portalIds);
      setMessage(
        `미실시 알림 발송 완료: 성공 ${result.sent}명, 실패 ${result.failed}명, 생략 ${result.skipped}명 (검사 완료·연락처 없음 등)`,
      );
      await load({ silent: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '미실시 알림 발송에 실패했습니다.');
    } finally {
      setRemindLoading(false);
      setDispatchProgress(null);
    }
  };

  const closeConfirm = () => {
    if (!remindLoading && !resendLoading) setConfirmAction(null);
  };

  const confirmBulkAction = async () => {
    if (confirmAction === 'remind') {
      const ids = remindEligibleSelected.map((r) => r.portalId);
      setConfirmAction(null);
      await handleRemind(ids);
    } else if (confirmAction === 'resend') {
      setConfirmAction(null);
      await handleResend();
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
        <h2 className="text-lg font-semibold text-white">발송 및 검사 현황</h2>
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
            onClick={() => setConfirmAction('remind')}
            disabled={
              remindLoading ||
              resendLoading ||
              remindEligibleSelected.length === 0
            }
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            title="미실시 검사자에게 현황·검사 링크 발송 (비밀번호 유지)"
          >
            {remindLoading
              ? '미실시 알림통보 중…'
              : `미실시 알림통보 (${remindEligibleSelected.length})`}
          </button>
          <button
            type="button"
            onClick={() => setConfirmAction('resend')}
            disabled={resendLoading || selected.size === 0}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {resendLoading ? '코드 재발송 중…' : `코드 재발송 (${selected.size})`}
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
          <table className="w-max max-w-full text-sm table-fixed">
            <colgroup>
              <col className="w-10" />
              <col className="w-10" />
              <col className="w-12" />
              <col className="w-28" />
              <col className="w-52" />
              <col className="w-32" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-24" />
            </colgroup>
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium">No.</th>
                <th className="px-3 py-2 text-left text-xs font-medium">선택</th>
                <th className="px-3 py-2 text-left text-xs font-medium">검사현황</th>
                <SortableColumnHeader
                  label="이름"
                  sortKey="displayName"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-28"
                />
                <SortableColumnHeader
                  label="이메일"
                  sortKey="email"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-52"
                />
                <SortableColumnHeader
                  label="휴대폰"
                  sortKey="phone"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-32"
                />
                <SortableColumnHeader
                  label="나의코드"
                  sortKey="myCode"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="발송"
                  sortKey="notifyStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
                <SortableColumnHeader
                  label="검사"
                  sortKey="testStatus"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={toggleSort}
                  className="w-24"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedRecipients.map((r, rowIndex) => {
                const notify = notifyLabel(r.notifyStatus);
                const summary = testSummary(r);
                const isOpen = expandedId === r.portalId;
                const tests = r.tests ?? [];

                return (
                  <React.Fragment key={r.portalId}>
                    <tr
                      className={`hover:bg-slate-800/50 ${isOpen ? 'bg-slate-800/40 border-b border-slate-700/60' : ''}`}
                    >
                      <td className="px-3 py-2 text-slate-400 align-top tabular-nums">{rowIndex + 1}</td>
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
                          aria-label={
                            isOpen
                              ? `${r.displayName || '내담자'} 검사 결과 접기`
                              : `${r.displayName || '내담자'} 검사 현황 펼치기`
                          }
                        >
                          {isOpen ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-white align-top w-28 max-w-[7rem] truncate">
                        {r.displayName || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 align-top truncate">{r.email || '—'}</td>
                      <td className="px-3 py-2 text-slate-300 align-top whitespace-nowrap">{r.phone || '—'}</td>
                      <td className="px-3 py-2 font-mono text-cyan-300 align-top whitespace-nowrap">
                        {formatAccessCodeDisplay(r.myCode)}
                      </td>
                      <td className={`px-3 py-2 align-top whitespace-nowrap ${notify.className}`}>{notify.text}</td>
                      <td className={`px-3 py-2 align-top whitespace-nowrap ${summary.className}`}>{summary.text}</td>
                    </tr>
                    {isOpen ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-0 border-b border-slate-700/60 bg-slate-900/20"
                          aria-hidden="true"
                        />
                        <td
                          colSpan={7}
                          className="px-3 py-3 pb-4 border-b border-slate-700/60 bg-slate-900/20 align-top"
                        >
                          {tests.length === 0 ? (
                            <p className="text-slate-500 text-sm rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2">
                              등록된 검사 항목이 없습니다.
                            </p>
                          ) : (
                            <div className="max-w-2xl rounded-lg border border-slate-600/80 bg-slate-950/55 overflow-hidden shadow-inner">
                              <table className="w-full text-sm table-fixed">
                                <colgroup>
                                  <col className="w-10" />
                                  <col />
                                  <col className="w-[5.5rem]" />
                                  <col className="w-[10.5rem]" />
                                  <col className="w-[5.5rem]" />
                                </colgroup>
                                <thead>
                                  <tr className="text-slate-400 text-xs border-b border-slate-700/70 bg-slate-900/40">
                                    <th className="px-3 py-2" aria-hidden="true" />
                                    <th className="px-3 py-2 text-left font-medium">검사명</th>
                                    <th className="px-3 py-2 text-left font-medium">상태</th>
                                    <th className="px-3 py-2 text-left font-medium">완료일시</th>
                                    <th className="px-3 py-2 text-left font-medium">결과 확인</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tests.map((t, testIndex) => {
                                    const st = testStatusLabel(t.status);
                                    return (
                                      <tr
                                        key={t.testId}
                                        className="border-b border-slate-800/80 last:border-0 hover:bg-slate-900/30"
                                      >
                                        <td className="px-3 py-2.5 text-slate-500 tabular-nums align-top">
                                          {testLetterLabel(testIndex)}
                                        </td>
                                        <td className="px-3 py-2.5 text-white align-top break-words">
                                          {t.testName || t.testId}
                                        </td>
                                        <td className={`px-3 py-2.5 align-top ${st.className}`}>
                                          {st.text}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-400 align-top text-xs leading-relaxed">
                                          {formatCompletedAt(t.completedAt)}
                                        </td>
                                        <td className="px-3 py-2.5 align-top">
                                          {t.status === 'completed' && t.resultId ? (
                                            <button
                                              type="button"
                                              onClick={() => openResultDetail(t.resultId!)}
                                              className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
                                            >
                                              결과 보기
                                            </button>
                                          ) : t.status === 'in_progress' ? (
                                            <span className="text-amber-300">진행 중</span>
                                          ) : (
                                            <span className="text-slate-500">미실시</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
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

      <div className="rounded-lg border border-slate-600/80 bg-slate-800/40 px-4 py-3">
        <p className="text-xs font-medium text-slate-400 mb-2.5">이용 안내</p>
        <ol className="space-y-2.5 text-xs leading-relaxed">
          <li className="flex gap-2.5">
            <span className="shrink-0 w-4 font-semibold text-slate-500 tabular-nums">1.</span>
            <span className="text-slate-400">
              <span className="text-slate-300">검사현황 ▶</span>를 누르면 해당 내담자의 검사별
              상태·완료일·결과를 확인할 수 있습니다. 다른 내담자를 선택하면 이전에 열린 목록은
              자동으로 닫힙니다.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0 w-4 font-semibold text-slate-500 tabular-nums">2.</span>
            <span className="text-slate-400">
              <span className="text-amber-200/90">미실시 알림통보</span>는 미완료 검사 현황과 검사
              링크만 이메일/SMS로 발송합니다.{' '}
              <span className="text-slate-300">비밀번호는 변경되지 않습니다.</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="shrink-0 w-4 font-semibold text-slate-500 tabular-nums">3.</span>
            <span className="text-slate-400">
              <span className="text-blue-300/90">코드 재발송</span>은 검사 코드와 비밀번호를 다시
              보냅니다.{' '}
              <span className="text-slate-300">재발송 시 비밀번호가 새로 발급</span>되며, 기존
              비밀번호는 더 이상 사용할 수 없습니다.
            </span>
          </li>
        </ol>
      </div>

      {dispatchProgress ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispatch-progress-title"
          aria-busy="true"
        >
          <div className="bg-slate-800 rounded-xl border border-slate-600 max-w-md w-full p-6 shadow-xl text-center">
            <div
              className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin"
              aria-hidden="true"
            />
            <h3 id="dispatch-progress-title" className="text-lg font-semibold text-white">
              발송 진행 중
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              {dispatchProgress.kind === 'remind'
                ? `미실시 알림 ${dispatchProgress.count}명에게 발송하고 있습니다.`
                : `코드 재발송 ${dispatchProgress.count}명을 처리하고 있습니다.`}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              이메일·SMS 발송 및 목록 갱신 중입니다. 잠시만 기다려 주세요.
            </p>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeConfirm}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-600">
              <h3 className="text-lg font-semibold text-white">
                {confirmAction === 'remind' ? '미실시 알림통보 확인' : '코드 재발송 확인'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {confirmAction === 'remind'
                  ? '아래 내용으로 이메일·SMS 알림을 발송합니다. 비밀번호는 변경되지 않습니다.'
                  : '아래 내용으로 접속 정보를 재발송합니다. 비밀번호가 새로 발급됩니다.'}
              </p>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-3 space-y-1">
                <p>
                  <span className="text-slate-500">검사코드 </span>
                  <span className="font-mono text-cyan-300">
                    {formatAccessCodeDisplay(data.joinAccessCode)}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500">검사명 </span>
                  <span className="text-white">{data.title || '—'}</span>
                </p>
              </div>

              {confirmAction === 'remind' ? (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">
                      발송 대상 {remindEligibleSelected.length}명
                    </p>
                    <ul className="space-y-3 max-h-48 overflow-y-auto">
                      {remindEligibleSelected.map((r) => {
                        const pending = pendingTestsFor(r);
                        return (
                          <li
                            key={r.portalId}
                            className="rounded-lg border border-slate-700 bg-slate-900/40 p-3"
                          >
                            <p className="text-white font-medium">{r.displayName || '—'}</p>
                            <p className="text-slate-400 text-xs mt-1">{contactChannels(r)}</p>
                            <p className="text-slate-400 text-xs mt-1">
                              진행 {r.completedCount}/{r.requiredCount} · 나의코드{' '}
                              {formatAccessCodeDisplay(r.myCode)}
                            </p>
                            <p className="text-amber-200/90 text-xs mt-2">
                              미완료:{' '}
                              {pending.length > 0
                                ? pending
                                    .map((t) => {
                                      const label = t.testName || t.testId;
                                      return t.status === 'in_progress'
                                        ? `${label}(진행 중)`
                                        : `${label}(미실시)`;
                                    })
                                    .join(', ')
                                : '—'}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {remindSkippedSelected.length > 0 ? (
                    <p className="text-slate-500 text-xs">
                      선택했으나 제외 {remindSkippedSelected.length}명:{' '}
                      {remindSkippedSelected
                        .map((r) => `${r.displayName || '—'}(${skipRemindReason(r)})`)
                        .join(', ')}
                    </p>
                  ) : null}
                  <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-3 text-slate-300">
                    <p className="text-amber-200 font-medium mb-2">발송 내용 (이메일/SMS)</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li>제목: [WizCoCo] 미실시 알림 (수신자 이름)</li>
                      <li>검사명, 진행 현황, 미완료 검사 목록</li>
                      <li>
                        검사코드 {formatAccessCodeDisplay(data.joinAccessCode)}, 나의코드(개인별)
                      </li>
                      <li>검사시작 URL: {loginUrl}</li>
                      <li>바로 시작 매직링크 (72시간 유효, 개인별 발급)</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-slate-300 font-medium mb-2">
                      발송 대상 {resendEligibleSelected.length}명
                      {resendSkippedSelected.length > 0
                        ? ` · 제외 ${resendSkippedSelected.length}명(연락처 없음)`
                        : ''}
                    </p>
                    <ul className="space-y-3 max-h-48 overflow-y-auto">
                      {resendEligibleSelected.map((r) => (
                        <li
                          key={r.portalId}
                          className="rounded-lg border border-slate-700 bg-slate-900/40 p-3"
                        >
                          <p className="text-white font-medium">{r.displayName || '—'}</p>
                          <p className="text-slate-400 text-xs mt-1">{contactChannels(r)}</p>
                          <p className="text-slate-400 text-xs mt-1">
                            나의코드 {formatAccessCodeDisplay(r.myCode)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-blue-700/40 bg-blue-950/30 p-3 text-slate-300">
                    <p className="text-blue-200 font-medium mb-2">발송 내용 (이메일/SMS)</p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                      <li>제목: [WizCoCo] 검사시작 접속 안내 (수신자 이름)</li>
                      <li>
                        검사코드 {formatAccessCodeDisplay(data.joinAccessCode)}, 나의코드(개인별)
                      </li>
                      <li className="text-amber-200">새 4자리 비밀번호 (기존 비밀번호 무효화)</li>
                      <li>검사시작 URL: {loginUrl}</li>
                      <li>바로 시작 매직링크 (72시간 유효, 개인별 발급)</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-600 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={remindLoading || resendLoading}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmBulkAction()}
                disabled={
                  remindLoading ||
                  resendLoading ||
                  (confirmAction === 'remind' && remindEligibleSelected.length === 0) ||
                  (confirmAction === 'resend' && resendEligibleSelected.length === 0)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
                  confirmAction === 'remind'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction === 'remind' ? '알림 발송' : '재발송'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
