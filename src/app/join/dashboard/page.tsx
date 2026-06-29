'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PortalTestList from '@/components/portal/PortalTestList';
import PortalResultViewModal, { type PortalResultViewState } from '@/components/portal/PortalResultViewModal';
import {
  deleteResult,
  getClientResult,
  listResults,
  lookupPublicAssessment,
  PublicAssessment,
  TestResultItem,
} from '@/lib/assessmentApi';
import { formatAccessCodeDisplay, isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { findFirstCompletedExpandKey, resultSubmittedLabel } from '@/lib/portalTestResults';
import { JOIN_STORAGE_KEY } from '@/lib/joinAssessmentSession';
import { setPortalReturnPath } from '@/lib/portalReturnPath';
import { isPortalModeForAccessCode } from '@/lib/joinFlowMode';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import {
  clearJoinGuestSession,
  ensureJoinGuestSession,
  hasJoinGuestSessionForCode,
} from '@/lib/joinGuestSession';
import {
  clearJoinParticipantSession,
  hasJoinParticipantSessionForCode,
  readJoinParticipantSession,
} from '@/lib/joinParticipantSession';

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 flex justify-center">
        <p className="text-slate-400">불러오는 중…</p>
      </div>
    </div>
  );
}

function formatUsageEndDateLabel(raw?: string): string {
  const s = (raw || '').trim();
  if (!s) return '무기한';
  try {
    const d = new Date(`${s}T00:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('ko-KR');
  } catch {
    return s;
  }
}

function JoinDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessCodeRaw = searchParams.get('accessCode') ?? '';
  const code = normalizeAccessCodeInput((accessCodeRaw || '').trim());

  const portalSession = readClientPortalSession();
  const participantSession = readJoinParticipantSession();
  const hasPortal = isPortalModeForAccessCode(code);
  const hasParticipant = hasJoinParticipantSessionForCode(code);
  const hasGuest = hasJoinGuestSessionForCode(code);

  const [assessment, setAssessment] = useState<PublicAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestReady, setGuestReady] = useState(false);
  const [error, setError] = useState('');
  const [joinResults, setJoinResults] = useState<TestResultItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [expandedTestKey, setExpandedTestKey] = useState<string | null>(null);
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
    if (!hasPortal) {
      router.replace('/portal/login/');
    }
  }, [hasPortal, router]);

  useEffect(() => {
    if (hasPortal) {
      setPortalReturnPath('/portal/');
      clearJoinGuestSession();
      clearJoinParticipantSession();
    }
  }, [hasPortal]);

  useEffect(() => {
    if (!isValidAccessCodeInput(code) || hasPortal || hasParticipant) {
      setGuestReady(true);
      return;
    }
    let cancelled = false;
    ensureJoinGuestSession(code)
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '검사 세션 시작에 실패했습니다.');
      })
      .finally(() => {
        if (!cancelled) setGuestReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [code, hasPortal, hasParticipant]);

  const loadAssessment = useCallback(() => {
    if (!isValidAccessCodeInput(code)) {
      setError('잘못된 검사 코드입니다.');
      setAssessment(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    lookupPublicAssessment(code)
      .then((data) => {
        setAssessment(data);
        try {
          sessionStorage.setItem(
            JOIN_STORAGE_KEY,
            JSON.stringify({
              accessCode: code,
              assessmentId: data.assessmentId,
              title: data.title,
              welcomeMessage: data.welcomeMessage,
              usageEndDate: data.usageEndDate || '',
              testList: data.testList,
            })
          );
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        setAssessment(null);
        setError(err instanceof Error ? err.message : '불러오기 실패');
      })
      .finally(() => setLoading(false));
  }, [code]);

  const loadResults = useCallback(async () => {
    if (!isValidAccessCodeInput(code)) return;
    setResultsLoading(true);
    try {
      const data = await listResults(code);
      setJoinResults(data.results || []);
    } catch (err) {
      setError((prev) => prev || (err instanceof Error ? err.message : '검사 결과를 불러오지 못했습니다.'));
      setJoinResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  useEffect(() => {
    if (!assessment || !isValidAccessCodeInput(code)) return;
    void loadResults();
  }, [assessment, code, loadResults]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible' || !assessment) return;
      void loadResults();
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [assessment, loadResults]);

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

  useEffect(() => {
    if (autoExpandDoneRef.current || expandedTestKey || !assessment) return;
    if (resultsLoading) return;
    const key = findFirstCompletedExpandKey(
      [
        {
          assessmentId: assessment.assessmentId,
          accessCode: code,
          testList: assessment.testList || [],
        },
      ],
      { [code]: joinResults },
      normalizeAccessCodeInput,
    );
    if (key) {
      setExpandedTestKey(key);
      autoExpandDoneRef.current = true;
    }
  }, [assessment, code, joinResults, resultsLoading, expandedTestKey]);

  const openTest = (testId: string, resultId?: string) => {
    setPortalReturnPath('/portal/');
    const params = new URLSearchParams({
      accessCode: code,
      testId: String(testId),
      from: 'portal',
    });
    if (resultId) params.set('resultId', resultId);
    router.push(`/join/test?${params.toString()}`);
  };

  const openResultView = (
    testName: string,
    resultId: string,
    roundNumber: number | null,
    resultItem: TestResultItem,
  ) => {
    setResultView({
      testName,
      roundNumber,
      accessCode: code,
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
      await loadResults();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!hasPortal || loading || !guestReady) {
    return <DashboardLoading />;
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-red-400 mb-4">{error || '검사코드 정보를 불러올 수 없습니다.'}</p>
            <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300">
              검사시작
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-slate-400">
            <Link href="/portal/" className="text-blue-400 hover:text-blue-300">
              ← 내 검사실
            </Link>
            {portalSession?.portal?.displayName ? (
              <span className="ml-2">{portalSession.portal.displayName}님</span>
            ) : null}
          </p>

          {participantSession?.displayName ? (
            <p className="text-sm text-slate-400 mb-2">{participantSession.displayName}님</p>
          ) : null}

          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">{assessment.title}</h1>
            <div className="text-sm text-slate-300 mb-4">
              <span className="text-slate-400">검사코드</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="font-mono text-cyan-300 tracking-wider">{formatAccessCodeDisplay(code)}</span>
            </div>
            <div className="text-sm text-slate-300 mb-4">
              <span className="text-slate-400">사용최종일</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-cyan-200">{formatUsageEndDateLabel(assessment.usageEndDate)}</span>
              {!assessment.usageEndDate ? (
                <span className="ml-2 text-slate-500">(비워두면 무기한 사용)</span>
              ) : null}
            </div>
            {assessment.welcomeMessage ? (
              <p className="text-slate-300 whitespace-pre-wrap mb-6">{assessment.welcomeMessage}</p>
            ) : null}

            <h2 className="text-lg font-semibold text-white mb-3">수행할 검사</h2>
            {!hasGuest && !hasParticipant && resultsLoading ? (
              <p className="text-amber-200/90 text-sm mb-2">검사 결과를 불러오는 중…</p>
            ) : null}
            <PortalTestList
              accessCode={code}
              assessmentId={assessment.assessmentId}
              testList={assessment.testList}
              results={joinResults}
              expandedTestKey={expandedTestKey}
              onExpandedChange={setExpandedTestKey}
              onStartTest={openTest}
              onViewResult={({ testName, resultId, roundNumber, resultItem }) =>
                openResultView(testName, resultId, roundNumber, resultItem)
              }
              onDeleteResult={({ resultId, testName, accessCode: resultCode }) => {
                setActionError('');
                setDeleteModal({ resultId, testName, accessCode: resultCode });
              }}
            />
          </div>
        </main>

        <p className="text-center mt-6">
          <Link href="/portal/" className="text-blue-400 hover:text-blue-300 text-sm">
            내 검사실로
          </Link>
        </p>
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

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <JoinDashboardContent />
    </Suspense>
  );
}
