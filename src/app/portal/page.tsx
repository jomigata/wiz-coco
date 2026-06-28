'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, linkSharedAssessment, linkMyCodeToPortal, sharePortalResult, type LinkedPortalSummary, type PortalDashboardAssessment } from '@/lib/clientPortalApi';
import { listResults, deleteResult, TestResultItem, clearForceGuestForAccessCode } from '@/lib/assessmentApi';
import {
  formatAccessCodeDisplay,
  formatJoinAccessCodeWhileTyping,
  formatMyCodeWhileTyping,
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import {
  clearClientPortalSession,
  readClientPortalSession,
} from '@/lib/clientPortalSession';
import { persistJoinAssessmentSession } from '@/lib/joinAssessmentSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';

type PortalAssessment = PortalDashboardAssessment;

function resultEffectiveTimestamp(r: TestResultItem): number {
  const iso = r.updatedAt || r.completedAt;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function pickFinalResultId(results: TestResultItem[]): string | null {
  if (results.length < 2) return null;
  let finalId = results[0]?.resultId ?? null;
  let best = resultEffectiveTimestamp(results[0]);
  for (const r of results.slice(1)) {
    const t = resultEffectiveTimestamp(r);
    if (t >= best) {
      best = t;
      finalId = r.resultId;
    }
  }
  return finalId;
}

function resultSubmittedLabel(r: TestResultItem): string | null {
  return r.submittedAt || r.completedAt;
}

function submissionTimestamp(r: TestResultItem): number {
  const iso = resultSubmittedLabel(r);
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 제출일시 기준 회차 — 생성 후 submittedAt 불변이므로 고정 */
function assignRoundNumbers(results: TestResultItem[]): Map<string, number> {
  const sorted = [...results].sort((a, b) => submissionTimestamp(a) - submissionTimestamp(b));
  const map = new Map<string, number>();
  sorted.forEach((r, i) => map.set(r.resultId, i + 1));
  return map;
}

function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">내 검사실을 불러오는 중…</p>
    </div>
  );
}

function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [myCode, setMyCode] = useState('');
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [linkedPortals, setLinkedPortals] = useState<LinkedPortalSummary[]>([]);
  const [resultsByCode, setResultsByCode] = useState<Record<string, TestResultItem[]>>({});

  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [linkError, setLinkError] = useState('');

  const [linkMyCode, setLinkMyCode] = useState('');
  const [linkMyPin, setLinkMyPin] = useState('');
  const [linkMyLoading, setLinkMyLoading] = useState(false);
  const [linkMyMessage, setLinkMyMessage] = useState('');
  const [linkMyError, setLinkMyError] = useState('');

  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});
  const [shareLoadingId, setShareLoadingId] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const [expandedTestKey, setExpandedTestKey] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    resultId: string;
    testName: string;
    accessCode: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadResults = useCallback(async (items: PortalAssessment[]) => {
    const session = readClientPortalSession();
    if (!session?.portalToken) return;
    const map: Record<string, TestResultItem[]> = {};
    const errors: string[] = [];
    await Promise.all(
      items.map(async (a) => {
        const code = normalizeAccessCodeInput(a.accessCode);
        if (!code) return;
        try {
          const data = await listResults(code);
          map[code] = data.results || [];
        } catch (err) {
          map[code] = [];
          const label = a.title || code;
          errors.push(
            err instanceof Error ? err.message : `${label} 결과를 불러오지 못했습니다.`
          );
        }
      })
    );
    setResultsByCode(map);
    if (errors.length) {
      setError((prev) => prev || errors[0]);
    }
  }, []);

  const load = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      router.replace('/portal/login/');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalDashboard(session.portalToken);
      const items = (data.assessments || []) as PortalAssessment[];
      setDisplayName(data.displayName || '내담자');
      setMyCode(data.accessCode || session.portal.accessCode);
      setAssessments(items);
      setLinkedPortals(data.linkedPortals || []);
      await loadResults(items);
    } catch (err) {
      clearClientPortalSession();
      setError(err instanceof Error ? err.message : '세션이 만료되었습니다.');
    } finally {
      setLoading(false);
    }
  }, [router, loadResults]);

  useEffect(() => {
    if (readClientPortalSession()?.portalToken) {
      clearJoinGuestSession();
      clearJoinParticipantSession();
    }
    void load();
  }, [load]);

  useEffect(() => {
    setPortalReturnPath('/portal/');
  }, []);

  useEffect(() => {
    const expand = (searchParams.get('expand') || '').trim();
    if (!expand) return;
    setExpandedTestKey(expand);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/portal/');
    }
    if (assessments.length) {
      void loadResults(assessments);
    }
  }, [searchParams, assessments, loadResults]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible' || !assessments.length) return;
      void loadResults(assessments);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [assessments, loadResults]);

  const openTest = (a: PortalAssessment, testId: string, resultId?: string) => {
    setPortalReturnPath('/portal/');
    clearJoinGuestSession();
    clearJoinParticipantSession();
    const code = normalizeAccessCodeInput(a.accessCode);
    clearForceGuestForAccessCode(code);
    clearJoinFreshParticipantFlow(code);
    persistJoinAssessmentSession(code, {
      assessmentId: a.assessmentId,
      title: a.title,
      welcomeMessage: a.welcomeMessage,
      usageEndDate: a.usageEndDate || '',
      testList: a.testList,
    });
    const params = new URLSearchParams({
      accessCode: code,
      testId: String(testId),
      from: 'portal',
    });
    if (resultId) params.set('resultId', resultId);
    router.push(`/join/test?${params.toString()}`);
  };

  const openResultView = (a: PortalAssessment, testId: string, resultId: string) => {
    setPortalReturnPath('/portal/');
    clearJoinGuestSession();
    clearJoinParticipantSession();
    const code = normalizeAccessCodeInput(a.accessCode);
    clearForceGuestForAccessCode(code);
    clearJoinFreshParticipantFlow(code);
    persistJoinAssessmentSession(code, {
      assessmentId: a.assessmentId,
      title: a.title,
      welcomeMessage: a.welcomeMessage,
      usageEndDate: a.usageEndDate || '',
      testList: a.testList,
    });
    const params = new URLSearchParams({
      accessCode: code,
      testId: String(testId),
      resultId,
      from: 'portal',
      view: '1',
    });
    router.push(`/join/test?${params.toString()}`);
  };

  const formatCompletedAt = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const testExpandKey = (assessmentId: string, testId: string) => `${assessmentId}:${testId}`;

  const handleDeleteResult = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      await deleteResult(deleteModal.resultId, undefined, deleteModal.accessCode);
      setDeleteModal(null);
      await loadResults(assessments);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkShared = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkMessage('');
    const code = normalizeAccessCodeInput(linkInput);
    if (!isValidAccessCodeInput(code)) {
      setLinkError('공유 검사코드 형식을 확인해 주세요.');
      return;
    }
    setLinkLoading(true);
    try {
      const session = readClientPortalSession();
      if (!session?.portalToken) throw new Error('로그인이 필요합니다.');
      const res = await linkSharedAssessment(session.portalToken, code);
      setAssessments((res.assessments || []) as PortalAssessment[]);
      setLinkedPortals((res as { linkedPortals?: LinkedPortalSummary[] }).linkedPortals || linkedPortals);
      await loadResults((res.assessments || []) as PortalAssessment[]);
      setLinkMessage(res.message || '검사코드가 연결되었습니다.');
      setLinkInput('');
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : '연결에 실패했습니다.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleLinkMyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkMyError('');
    setLinkMyMessage('');
    setLinkMyLoading(true);
    try {
      const session = readClientPortalSession();
      if (!session?.portalToken) throw new Error('로그인이 필요합니다.');
      const res = await linkMyCodeToPortal(session.portalToken, {
        accessCode: linkMyCode,
        pin: linkMyPin,
      });
      setAssessments(res.assessments || []);
      setLinkedPortals(res.linkedPortals || []);
      await loadResults(res.assessments || []);
      setLinkMyMessage(res.message);
      setLinkMyCode('');
      setLinkMyPin('');
    } catch (err) {
      setLinkMyError(err instanceof Error ? err.message : '나의코드 연결에 실패했습니다.');
    } finally {
      setLinkMyLoading(false);
    }
  };

  const handleShareResult = async (resultId: string) => {
    const target = normalizeAccessCodeInput(shareInputs[resultId] || '');
    if (!isValidAccessCodeInput(target)) {
      setShareMessage('공유할 검사코드 형식을 확인해 주세요.');
      return;
    }
    setShareLoadingId(resultId);
    setShareMessage('');
    try {
      const session = readClientPortalSession();
      if (!session?.portalToken) throw new Error('로그인이 필요합니다.');
      const res = await sharePortalResult(session.portalToken, { resultId, targetAccessCode: target });
      setShareMessage(res.message);
      setShareInputs((prev) => ({ ...prev, [resultId]: '' }));
      await loadResults(assessments);
    } catch (err) {
      setShareMessage(err instanceof Error ? err.message : '공유에 실패했습니다.');
    } finally {
      setShareLoadingId('');
    }
  };

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 pt-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300">
            다시 로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-white">내 검사실</h1>
                <p className="text-slate-300 text-sm mt-1">{displayName}님, 환영합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearClientPortalSession();
                  router.push('/portal/login/');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                로그아웃
              </button>
            </div>
            <p className="text-sm text-slate-400">
              나의코드{' '}
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(myCode)}</span>
            </p>
          </div>

          <div className="bg-slate-800/60 rounded-xl border border-slate-600 p-5">
            <h2 className="text-base font-semibold text-white mb-2">나의코드 공유</h2>
            <p className="text-slate-400 text-sm mb-3">
              다른 나의코드·비밀번호를 연결하면 검사코드별 자료를 한 화면에서 관리할 수 있습니다.
            </p>
            {linkedPortals.length > 0 ? (
              <ul className="mb-3 space-y-1 text-sm text-slate-300">
                {linkedPortals.map((p) => (
                  <li key={p.portalId}>
                    연결됨: {p.displayName || '내담자'} ·{' '}
                    <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(p.accessCode)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <form onSubmit={handleLinkMyCode} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={linkMyCode}
                onChange={(e) => setLinkMyCode(formatMyCodeWhileTyping(e.target.value))}
                placeholder="나의코드"
                className="flex-1 min-w-[8rem] px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled={linkMyLoading}
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={linkMyPin}
                onChange={(e) => setLinkMyPin(normalizeJoinPinDigits(e.target.value))}
                placeholder="비밀번호"
                className="w-28 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled={linkMyLoading}
              />
              <button
                type="submit"
                disabled={linkMyLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {linkMyLoading ? '연결 중…' : '나의코드 연결'}
              </button>
            </form>
            {linkMyMessage ? <p className="text-emerald-300 text-sm mt-2">{linkMyMessage}</p> : null}
            {linkMyError ? <p className="text-red-400 text-sm mt-2">{linkMyError}</p> : null}
          </div>

          <div className="bg-slate-800/60 rounded-xl border border-slate-600 p-5">
            <h2 className="text-base font-semibold text-white mb-2">검사코드 연결</h2>
            <p className="text-slate-400 text-sm mb-3">
              일반·그룹 검사코드를 입력하면 검사 목록에 추가됩니다.
            </p>
            <form onSubmit={handleLinkShared} className="flex flex-wrap gap-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(formatJoinAccessCodeWhileTyping(e.target.value))}
                placeholder="검사코드"
                className="flex-1 min-w-[10rem] px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                disabled={linkLoading}
              />
              <button
                type="submit"
                disabled={linkLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {linkLoading ? '연결 중…' : '추가'}
              </button>
            </form>
            {linkMessage ? <p className="text-emerald-300 text-sm mt-2">{linkMessage}</p> : null}
            {linkError ? <p className="text-red-400 text-sm mt-2">{linkError}</p> : null}
          </div>

          <h2 className="text-lg font-semibold text-white">검사코드별 진행 현황</h2>

          {assessments.length === 0 ? (
            <p className="text-slate-400 text-sm">배정·연결된 검사가 없습니다. 공유 검사코드를 추가해 주세요.</p>
          ) : (
            assessments.map((a) => {
              const code = normalizeAccessCodeInput(a.accessCode);
              const results = resultsByCode[code] || [];

              return (
                <section
                  key={a.assessmentId}
                  className="bg-slate-800/80 rounded-2xl border border-slate-600 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-white">{a.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        검사코드{' '}
                        <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(code)}</span>
                        {a.isLinkedShared ? (
                          <span className="ml-2 text-xs text-purple-300 border border-purple-500/40 rounded px-1.5 py-0.5">
                            수동 연결
                          </span>
                        ) : null}
                        {a.isFromLinkedPortal ? (
                          <span className="ml-2 text-xs text-indigo-300 border border-indigo-500/40 rounded px-1.5 py-0.5">
                            연결 나의코드 {formatAccessCodeDisplay(a.sourceMyCode || '')}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Link
                      href={`/join/dashboard?accessCode=${encodeURIComponent(code)}`}
                      onClick={() => {
                        setPortalReturnPath('/portal/');
                        persistJoinAssessmentSession(code, {
                          assessmentId: a.assessmentId,
                          title: a.title,
                          welcomeMessage: a.welcomeMessage,
                          usageEndDate: a.usageEndDate || '',
                          testList: a.testList,
                        });
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      검사실 열기 →
                    </Link>
                  </div>

                  {a.welcomeMessage ? (
                    <p className="text-slate-400 text-sm whitespace-pre-wrap">{a.welcomeMessage}</p>
                  ) : null}

                  {!a.testList?.length ? (
                    <p className="text-slate-500 text-sm">등록된 검사가 없습니다.</p>
                  ) : (
                    <ul className="space-y-2">
                      {a.testList.map((t) => {
                        const testName = t.name || t.testId;
                        const completedResults = results
                          .filter(
                            (r) =>
                              r.status === 'completed' && String(r.testId) === String(t.testId)
                          );
                        const roundById = assignRoundNumbers(completedResults);
                        const completedResultsForDisplay = [...completedResults].sort(
                          (x, y) => submissionTimestamp(y) - submissionTimestamp(x)
                        );
                        const hasCompleted = completedResults.length > 0;
                        const expandKey = testExpandKey(a.assessmentId, String(t.testId));
                        const isExpanded = expandedTestKey === expandKey;
                        const finalResultId = pickFinalResultId(completedResults);

                        return (
                          <li key={t.testId}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!hasCompleted) {
                                  openTest(a, t.testId);
                                  return;
                                }
                                setExpandedTestKey((prev) => (prev === expandKey ? null : expandKey));
                              }}
                              className="w-full text-left py-3 px-4 rounded-lg bg-slate-700/80 border border-slate-600 hover:bg-slate-700 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-white font-medium">{testName}</span>
                                <span className="text-slate-400 text-sm">
                                  {hasCompleted
                                    ? `${completedResults.length}회 완료 · ${isExpanded ? '접기' : '내역 보기'}`
                                    : '미완료 · 시작하기'}{' '}
                                  →
                                </span>
                              </div>
                              <span
                                className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                                  hasCompleted
                                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40'
                                    : 'bg-amber-900/40 text-amber-200 border border-amber-700/30'
                                }`}
                              >
                                {hasCompleted ? '검사 실시 완료' : '미실시'}
                              </span>
                            </button>

                            {hasCompleted && isExpanded ? (
                              <div className="mt-2 ml-2 pl-3 border-l-2 border-slate-600 space-y-2">
                                {completedResultsForDisplay.map((r) => (
                                  <div
                                    key={r.resultId}
                                    className="rounded-lg bg-slate-800/80 border border-slate-600 px-3 py-2.5 text-sm"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-white font-medium">
                                          <span>
                                            {roundById.get(r.resultId) ?? '—'}회차
                                            {finalResultId && r.resultId === finalResultId ? (
                                              <span className="ml-1.5 text-red-400 font-semibold">
                                                ✓ 최종
                                              </span>
                                            ) : null}
                                          </span>
                                          <span className="text-slate-300 font-normal">
                                            {' '}
                                            · 제출 {formatCompletedAt(resultSubmittedLabel(r))}
                                            {r.updatedAt ? (
                                              <span className="text-slate-400">
                                                {' '}
                                                (수정 {formatCompletedAt(r.updatedAt)})
                                              </span>
                                            ) : null}
                                          </span>
                                          {r.isShared ? (
                                            <span className="ml-2 text-sm font-normal text-purple-300">
                                              · 공유됨
                                              {r.sourceAccessCode
                                                ? ` (${formatAccessCodeDisplay(r.sourceAccessCode)}에서)`
                                                : ''}
                                            </span>
                                          ) : null}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openResultView(a, t.testId, r.resultId)}
                                          className="text-emerald-400 hover:text-emerald-300 text-xs"
                                        >
                                          결과보기
                                        </button>
                                        {!r.isShared ? (
                                          <button
                                            type="button"
                                            onClick={() => openTest(a, t.testId, r.resultId)}
                                            className="text-blue-400 hover:text-blue-300 text-xs"
                                          >
                                            수정
                                          </button>
                                        ) : null}
                                        {!r.isShared ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActionError('');
                                              setDeleteModal({
                                                resultId: r.resultId,
                                                testName,
                                                accessCode: code,
                                              });
                                            }}
                                            className="text-red-400 hover:text-red-300 text-xs"
                                          >
                                            삭제
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>
                                    {!r.isShared ? (
                                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                                        <input
                                          type="text"
                                          value={shareInputs[r.resultId] || ''}
                                          onChange={(e) =>
                                            setShareInputs((prev) => ({
                                              ...prev,
                                              [r.resultId]: formatJoinAccessCodeWhileTyping(e.target.value),
                                            }))
                                          }
                                          placeholder="공유할 검사코드"
                                          className="flex-1 min-w-[10rem] px-2 py-1.5 rounded bg-slate-900/60 border border-slate-600 text-white text-xs"
                                          disabled={shareLoadingId === r.resultId}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => void handleShareResult(r.resultId)}
                                          disabled={shareLoadingId === r.resultId}
                                          className="px-2 py-1.5 rounded bg-purple-700/80 text-white text-xs hover:bg-purple-700 disabled:opacity-50"
                                        >
                                          {shareLoadingId === r.resultId ? '공유 중…' : '결과 공유'}
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                ))}
                                {shareMessage ? (
                                  <p className="text-purple-200/90 text-xs px-1">{shareMessage}</p>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => openTest(a, t.testId)}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 px-1 py-1"
                                >
                                  + 새 검사 시작
                                </button>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })
          )}

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">안내</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>검사는 <strong className="text-slate-200">검사코드</strong>로 시작하고, 진행·관리는 <strong className="text-slate-200">나의코드</strong>로 내 검사실에서 확인합니다.</li>
              <li>나의코드가 여러 개면 위에서 연결해 한곳에서 관리하세요.</li>
              <li>완료된 검사는 다른 검사코드로 <strong className="text-slate-200">결과 공유</strong>할 수 있으며, 담당 상담사도 확인할 수 있습니다.</li>
            </ul>
          </div>
        </main>
      </div>

      {deleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !actionLoading && setDeleteModal(null)}
        >
          <div
            className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-2">검사 결과 삭제</h4>
            <p className="text-slate-300 text-sm mb-4">
              「{deleteModal.testName}」 결과를 삭제할까요?
            </p>
            {actionError ? <p className="text-red-400 text-sm mb-2">{actionError}</p> : null}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !actionLoading && setDeleteModal(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteResult()}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? '처리 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<PortalLoading />}>
      <ClientPortalContent />
    </Suspense>
  );
}
