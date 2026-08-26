'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, fetchPortalCareAssignments, type PortalDashboardAssessment, type PortalLegacyTestGroup } from '@/lib/clientPortalApi';
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

  const [resultView, setResultView] = useState<PortalResultViewState | null>(null);
  const [resultDetail, setResultDetail] = useState<Awaited<ReturnType<typeof getClientResult>> | null>(null);
  const [resultViewLoading, setResultViewLoading] = useState(false);
  const [resultViewError, setResultViewError] = useState('');
  const [portalTab, setPortalTab] = useState<PortalTab>('tests');
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

  const completedResultsCount = React.useMemo(() => {
    let count = 0;
    for (const a of assessments) {
      const code = normalizeAccessCodeInput(a.accessCode);
      const results = resultsByCode[code] || [];
      for (const t of a.testList || []) {
        if (
          results.some(
            (r) => r.status === 'completed' && String(r.testId) === String(t.testId),
          )
        ) {
          count += 1;
        }
      }
    }
    return count;
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
    <div className="flex h-[100dvh] flex-col bg-gray-900">
      <header className="shrink-0 border-b border-slate-800/80 bg-gray-900/95 px-4 pt-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3 pb-3">
          <div className="min-w-0 rounded-lg border border-white/15 bg-slate-800/60 px-4 py-2">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              나의코드{' '}
              <span className="font-mono text-cyan-300">{formatAccessCodeDisplay(myCode)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
          >
            로그아웃
          </button>
        </div>

        <div className="mx-auto max-w-3xl">
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
              검사목록
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
              결과목록 ({completedResultsCount})
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-12">
        <main className="mx-auto max-w-3xl space-y-6 pt-4">
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
            <div id="portal-results" className="space-y-6">
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
