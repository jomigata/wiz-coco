'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, fetchPortalCareAssignments, changeClientPortalPin, type PortalDashboardAssessment, type PortalLegacyTestGroup } from '@/lib/clientPortalApi';
import { listResults, getClientResult, TestResultItem, clearForceGuestForAccessCode } from '@/lib/assessmentApi';
import PortalTestList from '@/components/portal/PortalTestList';
import PortalCounselorInquiryChat from '@/components/portal/PortalCounselorInquiryChat';
import PortalCareAssignmentsPanel from '@/components/portal/PortalCareAssignmentsPanel';
import PortalReportsPanel from '@/components/portal/PortalReportsPanel';
import PortalResultViewModal, { type PortalResultViewState } from '@/components/portal/PortalResultViewModal';
import {
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
import { PORTAL_INQUIRY_SECTION_TITLE, PORTAL_MY_TEST_LIST_LABEL } from '@/lib/portalCareManagerLabels';
import type { PortalCareAssignmentItem } from '@/types/careAssignment';

type PortalAssessment = PortalDashboardAssessment;

function portalAssessmentGroupTitle(a: PortalAssessment): string {
  const org = (a.cohortName || '').trim() || (a.title || '').trim() || '—';
  const title = (a.title || '—').trim();
  if (!title || title === org) return org;
  return `${org} / ${title}`;
}
type PortalTab = 'tests' | 'chat' | 'reports';

function PortalLoading() {
  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-4 flex justify-center">
      <p className="text-slate-400">나의 검사목록으로 이동 중…</p>
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
    if (tab === 'care' || tab === 'tests') {
      setPortalTab('tests');
    } else if (tab === 'chat') {
      setPortalTab('chat');
    } else if (tab === 'reports' || tab === 'materials') {
      setPortalTab('reports');
    }
  }, [searchParams]);

  useEffect(() => {
    const focusResults = (searchParams.get('focus') || '').trim() === 'results';
    if (!focusResults) return;

    setPortalTab('tests');

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/portal/');
      requestAnimationFrame(() => {
        document.getElementById('portal-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
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

  const handleLogout = () => {
    clearClientPortalSession();
    router.push('/portal/login/');
  };

  if (loading) return <PortalLoading />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 px-4 pt-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/portal/login/')}
            className="text-blue-400 hover:text-blue-300"
          >
            다시 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="px-4 pt-4 pb-12">
        <main className="max-w-3xl mx-auto space-y-6">
          <div className="sticky top-0 z-40 -mx-4 border-b border-slate-800/80 bg-gray-900/95 px-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 rounded-lg border border-white/15 bg-slate-800/60 px-4 py-2">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  나의코드{' '}
                  <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(myCode)}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-slate-400 underline hover:text-slate-200"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={() => setPinModalOpen(true)}
                  className="text-xs text-sky-300 underline hover:text-sky-200"
                >
                  비밀번호 변경
                </button>
              </div>
            </div>

            <h1 className="pb-2 text-base font-semibold text-white sm:text-lg">
              {PORTAL_MY_TEST_LIST_LABEL}
            </h1>

            <div className="flex flex-wrap gap-x-1 gap-y-1 border-b border-slate-700/80">
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
                onClick={() => setPortalTab('chat')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  portalTab === 'chat'
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {PORTAL_INQUIRY_SECTION_TITLE}
              </button>
              <button
                type="button"
                onClick={() => setPortalTab('reports')}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  portalTab === 'reports'
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                결과보고서
              </button>
            </div>
          </div>

          {portalTab === 'chat' ? (
            <PortalCounselorInquiryChat counselorName={counselorName} embeddedInTab />
          ) : portalTab === 'reports' ? (
            <PortalReportsPanel
              assessments={assessments}
              resultsByCode={resultsByCode}
              onViewResult={({ accessCode, testName, resultId, roundNumber, resultItem }) =>
                openResultView(accessCode, testName, resultId, roundNumber, resultItem)
              }
            />
          ) : (
            <div id="portal-results" className="scroll-mt-40 space-y-6">
              {assessments.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  배정된 검사가 없습니다. 담당자에게 상담(코드)·나의코드를 확인해 주세요.
                </p>
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
                          onStartTest={(testId, resultId) => openTest(a, testId, resultId)}
                          onViewResult={({ testName, resultId, roundNumber, resultItem }) =>
                            openResultView(code, testName, resultId, roundNumber, resultItem)
                          }
                        />
                      )}
                    </section>
                  );
                })
              )}

              <PortalCareAssignmentsPanel assignedAssessmentIds={assessments.map((a) => a.assessmentId)} />
            </div>
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
