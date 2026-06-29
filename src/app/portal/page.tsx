'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchPortalDashboard, type PortalDashboardAssessment } from '@/lib/clientPortalApi';
import { listResults, deleteResult, getClientResult, TestResultItem, clearForceGuestForAccessCode } from '@/lib/assessmentApi';
import PortalTestList from '@/components/portal/PortalTestList';
import PortalResultViewModal, { type PortalResultViewState } from '@/components/portal/PortalResultViewModal';
import {
  findFirstCompletedExpandKey,
  resultSubmittedLabel,
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

type PortalAssessment = PortalDashboardAssessment;

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
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const [resultView, setResultView] = useState<PortalResultViewState | null>(null);
  const [resultDetail, setResultDetail] = useState<Awaited<ReturnType<typeof getClientResult>> | null>(null);
  const [resultViewLoading, setResultViewLoading] = useState(false);
  const [resultViewError, setResultViewError] = useState('');

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
    const expand = (searchParams.get('expand') || '').trim();
    if (!expand) return;
    expandFromUrlRef.current = true;
    setExpandedTestKey(expand);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/portal/');
    }
    if (assessments.length) {
      void loadResults(assessments);
    }
  }, [searchParams, assessments, loadResults]);

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
    const params = new URLSearchParams({
      accessCode: code,
      testId: String(testId),
      from: 'portal',
    });
    if (resultId) params.set('resultId', resultId);
    router.push(`/join/test?${params.toString()}`);
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
      updatedAt: resultItem.updatedAt ?? null,
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

          <h2 className="text-lg font-semibold text-white">검사코드별 진행 현황</h2>

          {assessments.length === 0 ? (
            <p className="text-slate-400 text-sm">배정된 검사가 없습니다. 담당자에게 검사코드·나의코드를 확인해 주세요.</p>
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
                      onDeleteResult={({ resultId, testName, accessCode: resultCode }) => {
                        setActionError('');
                        setDeleteModal({ resultId, testName, accessCode: resultCode });
                      }}
                    />
                  )}
                </section>
              );
            })
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
