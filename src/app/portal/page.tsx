'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, type PortalDashboardAssessment } from '@/lib/clientPortalApi';
import { listResults, deleteResult, getClientResult, TestResultItem, clearForceGuestForAccessCode } from '@/lib/assessmentApi';
import PortalTestList from '@/components/portal/PortalTestList';
import PortalCareAssignmentsPanel from '@/components/portal/PortalCareAssignmentsPanel';
import PortalResultViewModal, { type PortalResultViewState } from '@/components/portal/PortalResultViewModal';
import {
  findFirstCompletedExpandKey,
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
import { stripPortalWelcomeBoilerplate } from '@/lib/welcomeMessageSamples';
import { persistJoinAssessmentSession } from '@/lib/joinAssessmentSession';
import { clearJoinGuestSession } from '@/lib/joinGuestSession';
import { clearJoinParticipantSession } from '@/lib/joinParticipantSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import { clearJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import { getJoinTestPath } from '@/lib/portalTestNavigation';

type PortalAssessment = PortalDashboardAssessment;

function portalAssessmentGroupTitle(a: PortalAssessment): string {
  const org = (a.cohortName || '').trim() || (a.title || '').trim() || '—';
  const title = (a.title || '—').trim();
  return `${org}/${title}`;
}
type PortalTab = 'tests' | 'care';

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
      setMyCode(data.accessCode || session.portal.accessCode);
      setAssessments(items);
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
    const tab = (searchParams.get('tab') || '').trim();
    if (tab === 'care') setPortalTab('care');
    else if (tab === 'tests') setPortalTab('tests');
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
      await loadResults(assessments);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
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

          <div className="flex gap-2 border-b border-slate-700/80">
            <button
              type="button"
              onClick={() => setPortalTab('tests')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                portalTab === 'tests'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              검사 진행
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
              추가 과제·치료
            </button>
          </div>

          {portalTab === 'care' ? (
            <PortalCareAssignmentsPanel />
          ) : (
            <>
          <h2 id="portal-results" className="text-lg font-semibold text-white scroll-mt-24">
            {searchParams.get('focus') === 'results' ? '완료한 검사 결과' : '검사 진행 현황'}
          </h2>

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
                  <div>
                    <h3 className="text-lg font-medium text-white">
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

                  {(() => {
                    const welcomeText = stripPortalWelcomeBoilerplate(a.welcomeMessage || '');
                    return welcomeText ? (
                      <p className="text-slate-400 text-sm whitespace-pre-wrap">{welcomeText}</p>
                    ) : null;
                  })()}

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={() => !actionLoading && setDeleteModal(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-delete-title"
          >
            <div className="border-b border-red-500/20 bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 px-6 py-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
                  aria-hidden
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h4 id="portal-delete-title" className="text-lg font-semibold text-white">
                    검사 결과 삭제
                  </h4>
                  <p className="mt-1 text-sm text-slate-400">삭제 후에는 복구할 수 없습니다.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  삭제 대상
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">
                  {deleteModal.roundNumber ? (
                    <>
                      선택된 {deleteModal.roundNumber}회차 「
                      <span className="font-medium text-white">{deleteModal.testName}</span>
                      」의 내용/결과가 삭제됩니다.
                    </>
                  ) : (
                    <>
                      선택된 「<span className="font-medium text-white">{deleteModal.testName}</span>
                      」의 내용/결과가 삭제됩니다.
                    </>
                  )}
                </p>
              </div>
              {actionError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {actionError}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-black/20 px-6 py-4">
              <button
                type="button"
                onClick={() => !actionLoading && setDeleteModal(null)}
                disabled={actionLoading}
                className="rounded-lg border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteResult()}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-900/30 transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {actionLoading ? '처리 중…' : '삭제 확인'}
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
