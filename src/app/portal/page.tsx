'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, fetchPortalCareAssignments, changeClientPortalPin, type PortalDashboardAssessment, type PortalLegacyTestGroup } from '@/lib/clientPortalApi';
import { listResults, deleteResult, getClientResult, TestResultItem, clearForceGuestForAccessCode } from '@/lib/assessmentApi';
import PortalTestList from '@/components/portal/PortalTestList';
import PortalHomeHero from '@/components/portal/PortalHomeHero';
import PortalOptionalPurchaseCard from '@/components/portal/PortalOptionalPurchaseCard';
import PortalCareAssignmentsPanel from '@/components/portal/PortalCareAssignmentsPanel';
import PortalLegacyMaterialsPanel from '@/components/portal/PortalLegacyMaterialsPanel';
import PortalResultViewModal, { type PortalResultViewState } from '@/components/portal/PortalResultViewModal';
import {
  findFirstCompletedExpandKey,
  resultSubmittedLabel,
  resultUpdatedLabel,
} from '@/lib/portalTestResults';
import {
  formatAccessCodeDisplay,
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
import { getJoinTestPath } from '@/lib/portalTestNavigation';
import { pickPortalHomeTask } from '@/lib/portalHomeTask';
import type { PortalCareAssignmentItem } from '@/types/careAssignment';

type PortalAssessment = PortalDashboardAssessment;

function portalAssessmentGroupTitle(a: PortalAssessment): string {
  const org = (a.cohortName || '').trim() || (a.title || '').trim() || '—';
  const title = (a.title || '—').trim();
  if (!title || title === org) return org;
  return `${org} / ${title}`;
}
type PortalTab = 'tests' | 'care' | 'materials';

function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-900 pt-24 flex justify-center">
      <p className="text-slate-400">내 검사실로 이동 중…</p>
    </div>
  );
}

function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [counselorName, setCounselorName] = useState('');
  const [counselorEmail, setCounselorEmail] = useState('');
  const [myCode, setMyCode] = useState('');
  const [assessments, setAssessments] = useState<PortalAssessment[]>([]);
  const [legacyTests, setLegacyTests] = useState<PortalLegacyTestGroup[]>([]);
  const [resultsByCode, setResultsByCode] = useState<Record<string, TestResultItem[]>>({});

  const [expandedTestKey, setExpandedTestKey] = useState<string | null>(null);
  const expandFromUrlRef = useRef(false);
  const autoExpandDoneRef = useRef(false);
  const [deleteModal, setDeleteModal] = useState<{
    resultId: string;
    testName: string;
    accessCode: string;
    roundNumber: number | null;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [resultView, setResultView] = useState<PortalResultViewState | null>(null);
  const [resultDetail, setResultDetail] = useState<Awaited<ReturnType<typeof getClientResult>> | null>(null);
  const [resultViewLoading, setResultViewLoading] = useState(false);
  const [resultViewError, setResultViewError] = useState('');
  const [portalTab, setPortalTab] = useState<PortalTab>('tests');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinCurrent, setPinCurrent] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [careTotalCount, setCareTotalCount] = useState(0);
  const [careItems, setCareItems] = useState<PortalCareAssignmentItem[]>([]);
  const [showRecords, setShowRecords] = useState(false);

  useEffect(() => {
    if (!resultView) {
      setResultDetail(null);
      setResultViewError('');
      return;
    }
    let cancelled = false;
    setResultViewLoading(true);
    setResultViewError('');
    setResultDetail(null);
    getClientResult(resultView.resultId, resultView.accessCode)
      .then((data) => {
        if (!cancelled) setResultDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setResultViewError(err instanceof Error ? err.message : '결과를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setResultViewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resultView]);

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
      setCounselorName(String((data as { counselorName?: string }).counselorName || ''));
      setCounselorEmail(String((data as { counselorEmail?: string }).counselorEmail || ''));
      setMyCode(data.accessCode || session.portal.accessCode);
      setAssessments(items);
      setLegacyTests(data.legacyTests || []);
      await loadResults(items);
      try {
        const careData = await fetchPortalCareAssignments(session.portalToken);
        const summary = careData.summary;
        setCareItems([...(careData.active || []), ...(careData.completed || [])]);
        setCareTotalCount((summary.activeCount ?? 0) + (summary.completedCount ?? 0));
      } catch {
        setCareItems([]);
        setCareTotalCount(0);
      }
    } catch (err) {
      clearClientPortalSession();
      setError(err instanceof Error ? err.message : '세션이 만료되었습니다.');
    } finally {
      setLoading(false);
    }
  }, [router, loadResults]);

  const testProgressSummary = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    for (const a of assessments) {
      const code = normalizeAccessCodeInput(a.accessCode);
      const results = resultsByCode[code] || [];
      for (const t of a.testList || []) {
        total += 1;
        if (
          results.some(
            (r) => r.status === 'completed' && String(r.testId) === String(t.testId),
          )
        ) {
          completed += 1;
        }
      }
    }
    return { total, completed };
  }, [assessments, resultsByCode]);

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
    const tab = (searchParams.get('tab') || '').trim();
    if (tab === 'care') {
      setPortalTab('care');
      setShowRecords(true);
    } else if (tab === 'materials') {
      setPortalTab('materials');
      setShowRecords(true);
    } else if (tab === 'tests') {
      setPortalTab('tests');
      setShowRecords(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const expand = (searchParams.get('expand') || '').trim();
    const focusResults = (searchParams.get('focus') || '').trim() === 'results';
    if (!expand && !focusResults) return;

    if (expand) {
      expandFromUrlRef.current = true;
      setExpandedTestKey(expand);
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', focusResults ? '/portal/?focus=results' : '/portal/');
      if (focusResults) {
        requestAnimationFrame(() => {
          document.getElementById('portal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
    if (assessments.length) {
      void loadResults(assessments);
    }
  }, [searchParams, assessments, loadResults]);

  useEffect(() => {
    if ((searchParams.get('focus') || '').trim() !== 'results') return;
    if (!assessments.length || !Object.keys(resultsByCode).length) return;
    if (expandedTestKey) return;
    const key = findFirstCompletedExpandKey(
      assessments.map((a) => ({
        assessmentId: a.assessmentId,
        accessCode: a.accessCode,
        testList: a.testList || [],
      })),
      resultsByCode,
      normalizeAccessCodeInput,
    );
    if (key) setExpandedTestKey(key);
  }, [searchParams, assessments, resultsByCode, expandedTestKey]);

  useEffect(() => {
    if (expandFromUrlRef.current || autoExpandDoneRef.current || expandedTestKey) return;
    if (!assessments.length || !Object.keys(resultsByCode).length) return;
    const key = findFirstCompletedExpandKey(
      assessments.map((a) => ({
        assessmentId: a.assessmentId,
        accessCode: a.accessCode,
        testList: a.testList || [],
      })),
      resultsByCode,
      normalizeAccessCodeInput,
    );
    if (key) {
      setExpandedTestKey(key);
      autoExpandDoneRef.current = true;
    }
  }, [assessments, resultsByCode, expandedTestKey]);

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
    const code = normalizeAccessCodeInput(a.accessCode);
    if (!resultId) {
      const results = resultsByCode[code] || [];
      const alreadyCompleted = results.some(
        (r) => r.status === 'completed' && String(r.testId) === String(testId),
      );
      if (alreadyCompleted) return;
    }
    setPortalReturnPath('/portal/');
    clearJoinGuestSession();
    clearJoinParticipantSession();
    clearForceGuestForAccessCode(code);
    clearJoinFreshParticipantFlow(code);
    persistJoinAssessmentSession(code, {
      assessmentId: a.assessmentId,
      title: a.title,
      welcomeMessage: a.welcomeMessage,
      usageEndDate: a.usageEndDate || '',
      testList: a.testList,
    });
    router.push(getJoinTestPath(code, String(testId), { from: 'portal', resultId }));
  };

  const openResultView = (
    accessCode: string,
    testName: string,
    resultId: string,
    roundNumber: number | null,
    resultItem: TestResultItem,
  ) => {
    setResultView({
      testName,
      roundNumber,
      accessCode: normalizeAccessCodeInput(accessCode),
      resultId,
      submittedAt: resultSubmittedLabel(resultItem),
      updatedAt: resultUpdatedLabel(resultItem),
    });
  };

  const closeResultView = () => {
    setResultView(null);
    setResultDetail(null);
    setResultViewError('');
  };

  const handleDeleteResult = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
    setActionError('');
    try {
      await deleteResult(deleteModal.resultId, undefined, deleteModal.accessCode);
      setDeleteModal(null);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePin = async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      router.replace('/portal/login/');
      return;
    }
    const current = normalizeJoinPinDigits(pinCurrent);
    const next = normalizeJoinPinDigits(pinNew);
    const confirm = normalizeJoinPinDigits(pinConfirm);
    if (current.length !== 4 || next.length !== 4) {
      setPinError('비밀번호는 4자리 숫자여야 합니다.');
      return;
    }
    if (next !== confirm) {
      setPinError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (current === next) {
      setPinError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }
    setPinLoading(true);
    setPinError('');
    setPinSuccess('');
    try {
      await changeClientPortalPin(session.portalToken, { currentPin: current, newPin: next });
      setPinSuccess('비밀번호가 변경되었습니다.');
      setPinCurrent('');
      setPinNew('');
      setPinConfirm('');
      window.setTimeout(() => {
        setPinModalOpen(false);
        setPinSuccess('');
      }, 1200);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPinLoading(false);
    }
  };

  const closePinModal = () => {
    if (pinLoading) return;
    setPinModalOpen(false);
    setPinCurrent('');
    setPinNew('');
    setPinConfirm('');
    setPinError('');
    setPinSuccess('');
  };

  const homeTask = React.useMemo(
    () =>
      pickPortalHomeTask({
        assessments: assessments.map((a) => ({
          assessmentId: a.assessmentId,
          accessCode: a.accessCode,
          title: a.title,
          testList: a.testList,
        })),
        resultsByCode,
        careItems,
        normalizeCode: normalizeAccessCodeInput,
      }),
    [assessments, resultsByCode, careItems],
  );

  const handlePrimaryHomeAction = () => {
    if (homeTask.kind === 'test') {
      const assessment = assessments.find((a) => a.assessmentId === homeTask.assessmentId);
      if (assessment) {
        openTest(assessment, homeTask.testId, homeTask.resultId);
      }
      return;
    }
    if (homeTask.kind === 'care') {
      setShowRecords(true);
      setPortalTab('care');
      return;
    }
    setShowRecords(true);
  };

  const openRecords = () => {
    setShowRecords(true);
    if (homeTask.kind === 'all_done') {
      setPortalTab('tests');
    }
  };

  if (loading) return <PortalLoading />;

  const legacyMaterialsCount = legacyTests.reduce(
    (sum, g) => sum + (g.testList?.length || 0),
    0,
  );

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
          {!showRecords ? (
            <>
              <PortalHomeHero
                displayName={displayName}
                counselorName={counselorName}
                counselorEmail={counselorEmail}
                task={homeTask}
                onPrimaryAction={handlePrimaryHomeAction}
                onOpenRecords={openRecords}
              />
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-sm text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                  나의코드{' '}
                  <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(myCode)}</span>
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPinModalOpen(true)}
                    className="text-xs text-sky-300 hover:text-sky-200 underline"
                  >
                    비밀번호 변경
                  </button>
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
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowRecords(false)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← 홈으로
              </button>

              <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-5 shadow-xl">
                <h2 className="text-lg font-bold text-white">기록 · 도움말</h2>
                <p className="text-sm text-slate-400 mt-1">
                  검사 진행, 과제, 자료를 확인할 수 있습니다.
                </p>
              </div>

          <div className="flex gap-2 border-b border-slate-700/80 overflow-x-auto">
            <button
              type="button"
              onClick={() => setPortalTab('tests')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                portalTab === 'tests'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              검사 진행 현황 ({testProgressSummary.total})
            </button>
            <button
              type="button"
              onClick={() => setPortalTab('care')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                portalTab === 'care'
                  ? 'border-violet-400 text-violet-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              추가 과제·치료 ({careTotalCount})
            </button>
            <button
              type="button"
              onClick={() => setPortalTab('materials')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                portalTab === 'materials'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              기타 자료 ({legacyMaterialsCount})
            </button>
          </div>

          {portalTab === 'care' ? (
            <PortalCareAssignmentsPanel assignedAssessmentIds={assessments.map((a) => a.assessmentId)} />
          ) : portalTab === 'materials' ? (
            <PortalLegacyMaterialsPanel
              legacyTests={legacyTests}
              expandedTestKey={expandedTestKey}
              onExpandedChange={setExpandedTestKey}
              onViewResult={(accessCode, params) =>
                openResultView(
                  accessCode,
                  params.testName,
                  params.resultId,
                  params.roundNumber,
                  params.resultItem,
                )
              }
              onDeleteResult={({ resultId, testName, accessCode: resultCode, roundNumber }) => {
                setActionError('');
                setDeleteModal({ resultId, testName, accessCode: resultCode, roundNumber });
              }}
            />
          ) : (
            <div id="portal-results" className="scroll-mt-24 space-y-6">
          {assessments.length === 0 ? (
            <p className="text-slate-400 text-sm">배정된 검사가 없습니다. 담당자에게 상담(코드)·나의코드를 확인해 주세요.</p>
          ) : (
            assessments.map((a) => {
              const code = normalizeAccessCodeInput(a.accessCode);
              const results = resultsByCode[code] || [];

              return (
                <section
                  key={a.assessmentId}
                  className="bg-slate-800/80 rounded-2xl border border-slate-600 p-5 space-y-3"
                >
                  <div className="border-b border-slate-700/40 pb-2.5 mb-1">
                    <h3 className="text-base sm:text-lg font-medium text-slate-400">
                      {portalAssessmentGroupTitle(a)}
                    </h3>
                    {a.isLinkedShared || a.isFromLinkedPortal ? (
                      <p className="text-sm text-slate-400 mt-1">
                        {a.isLinkedShared ? (
                          <span className="text-xs text-purple-300 border border-purple-500/40 rounded px-1.5 py-0.5">
                            수동 연결
                          </span>
                        ) : null}
                        {a.isFromLinkedPortal ? (
                          <span
                            className={`text-xs text-indigo-300 border border-indigo-500/40 rounded px-1.5 py-0.5${a.isLinkedShared ? ' ml-2' : ''}`}
                          >
                            연결 나의코드 {formatAccessCodeDisplay(a.sourceMyCode || '')}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>

                  {!a.testList?.length ? (
                    <p className="text-slate-500 text-sm">등록된 검사가 없습니다.</p>
                  ) : (
                    <PortalTestList
                      accessCode={code}
                      assessmentId={a.assessmentId}
                      testList={a.testList}
                      results={results}
                      expandedTestKey={expandedTestKey}
                      onExpandedChange={setExpandedTestKey}
                      onStartTest={(testId, resultId) => openTest(a, testId, resultId)}
                      onViewResult={({ testName, resultId, roundNumber, resultItem }) =>
                        openResultView(code, testName, resultId, roundNumber, resultItem)
                      }
                      onDeleteResult={({ resultId, testName, accessCode: resultCode, roundNumber }) => {
                        setActionError('');
                        setDeleteModal({ resultId, testName, accessCode: resultCode, roundNumber });
                      }}
                    />
                  )}
                </section>
              );
            })
          )}
            </div>
          )}

          <PortalOptionalPurchaseCard />
            </>
          )}
        </main>
      </div>

      {resultView ? (
        <PortalResultViewModal
          resultView={resultView}
          resultDetail={resultDetail}
          loading={resultViewLoading}
          error={resultViewError}
          onClose={closeResultView}
        />
      ) : null}

      {deleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => !actionLoading && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border-2 border-red-500/40 bg-[#151c28] p-6 shadow-xl shadow-red-950/25"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-delete-title"
          >
            <h4 id="portal-delete-title" className="text-lg font-semibold text-white">
              검사 결과 삭제
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {deleteModal.roundNumber ? (
                <>
                  선택된 {deleteModal.roundNumber}회차 「{deleteModal.testName}」의 내용/결과가
                  삭제됩니다.
                </>
              ) : (
                <>선택된 「{deleteModal.testName}」의 내용/결과가 삭제됩니다.</>
              )}
            </p>
            <p className="mt-3 rounded-md border border-red-500/35 bg-red-950/30 px-3 py-2 text-sm font-medium text-red-200">
              삭제 후에는 복구할 수 없습니다.
            </p>
            {actionError ? (
              <p className="mt-3 rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                {actionError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !actionLoading && setDeleteModal(null)}
                disabled={actionLoading}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteResult()}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {actionLoading ? '처리 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pinModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closePinModal}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-sky-500/30 bg-[#151c28] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-pin-title"
          >
            <h4 id="portal-pin-title" className="text-lg font-semibold text-white">
              비밀번호 변경
            </h4>
            <p className="mt-2 text-sm text-slate-400">4자리 숫자 비밀번호를 변경합니다.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="portal-pin-current" className="block text-xs text-slate-400 mb-1">
                  현재 비밀번호
                </label>
                <input
                  id="portal-pin-current"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinCurrent}
                  onChange={(e) => setPinCurrent(normalizeJoinPinDigits(e.target.value))}
                  disabled={pinLoading}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-center font-mono text-white tracking-widest"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="portal-pin-new" className="block text-xs text-slate-400 mb-1">
                  새 비밀번호
                </label>
                <input
                  id="portal-pin-new"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinNew}
                  onChange={(e) => setPinNew(normalizeJoinPinDigits(e.target.value))}
                  disabled={pinLoading}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-center font-mono text-white tracking-widest"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="portal-pin-confirm" className="block text-xs text-slate-400 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  id="portal-pin-confirm"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(normalizeJoinPinDigits(e.target.value))}
                  disabled={pinLoading}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-center font-mono text-white tracking-widest"
                  autoComplete="new-password"
                />
              </div>
            </div>
            {pinError ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {pinError}
              </p>
            ) : null}
            {pinSuccess ? (
              <p className="mt-3 text-sm text-emerald-300" role="status">
                {pinSuccess}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closePinModal}
                disabled={pinLoading}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleChangePin()}
                disabled={pinLoading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {pinLoading ? '변경 중…' : '변경'}
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
