'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { lookupPublicAssessment, submitResult, getClientResult, updateClientResult, listResults, clearForceGuestForAccessCode, setForceGuestForAccessCode } from '@/lib/assessmentApi';
import { isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { genericJoinQuestions } from '@/data/genericJoinQuestions';
import { JOIN_STORAGE_KEY, navigateToJoinSelectionDashboard } from '@/lib/joinAssessmentSession';
import { buildPortalProgressReturnUrl } from '@/lib/portalReturnPath';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { canTrackJoinResults } from '@/lib/assessmentApi';
import { isPortalModeForAccessCode } from '@/lib/joinFlowMode';
import {
  clearJoinParticipantSession,
  hasJoinParticipantSessionForCode,
} from '@/lib/joinParticipantSession';
import { clearJoinGuestSession, ensureJoinGuestSession } from '@/lib/joinGuestSession';

const SCALE_LABELS: Record<number, string> = {
  1: '매우 그렇지 않다',
  2: '그렇지 않다',
  3: '약간 그렇지 않다',
  4: '보통',
  5: '약간 그렇다',
  6: '그렇다',
  7: '매우 그렇다',
};

export default function TestRunnerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [accessCode, setAccessCode] = useState('');
  const [testId, setTestId] = useState('');
  const [editResultId, setEditResultId] = useState('');
  const [fromPortal, setFromPortal] = useState(false);

  const [title, setTitle] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accessCheckLoading, setAccessCheckLoading] = useState(true);
  const [accessCheckError, setAccessCheckError] = useState('');

  const code = normalizeAccessCodeInput(accessCode);
  const questions = genericJoinQuestions;
  const hasPortal = isPortalModeForAccessCode(code);
  const hasParticipant = hasJoinParticipantSessionForCode(code);
  const canSubmitAuth = canTrackJoinResults(code);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAccessCode((params.get('accessCode') || '').trim());
      setTestId((params.get('testId') || '').trim());
      setEditResultId((params.get('resultId') || '').trim());
      setFromPortal((params.get('from') || '').trim() === 'portal');
    } catch {
      setAccessCode('');
      setTestId('');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(JOIN_STORAGE_KEY);
    } catch {
      // ignore
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { testList: { testId: string; name: string }[] };
        const t = parsed.testList?.find((x) => String(x.testId) === String(testId));
        setTitle(t?.name || testId);
      } catch {
        setTitle(testId);
      }
    } else {
      setTitle(testId);
    }
  }, [testId]);

  useEffect(() => {
    const run = async () => {
      if (!code || !isValidAccessCodeInput(code)) {
        setAccessCheckError('잘못된 검사코드입니다.');
        setAccessCheckLoading(false);
        return;
      }
      setAccessCheckLoading(true);
      setAccessCheckError('');
      try {
        await lookupPublicAssessment(code);
        if (hasPortal) {
          clearJoinGuestSession();
          clearJoinParticipantSession();
          try {
            await listResults(code);
            clearForceGuestForAccessCode(code);
          } catch {
            if (fromPortal) {
              await ensureJoinGuestSession(code);
              setForceGuestForAccessCode(code);
            } else {
              throw new Error('이 검사코드는 현재 로그인한 나의코드에 연결되어 있지 않습니다.');
            }
          }
        } else if (!hasJoinParticipantSessionForCode(code)) {
          await ensureJoinGuestSession(code);
        }
      } catch (err) {
        setAccessCheckError(err instanceof Error ? err.message : '검사코드를 사용할 수 없습니다.');
      } finally {
        setAccessCheckLoading(false);
      }
    };
    void run();
  }, [code, hasPortal, fromPortal]);

  useEffect(() => {
    if (!editResultId || !code || accessCheckLoading || accessCheckError) return;
    let cancelled = false;
    setLoadingResult(true);
    getClientResult(editResultId, code)
      .then((data) => {
        if (cancelled) return;
        const raw = data.responses;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const next: Record<string, number> = {};
          for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
            if (typeof val === 'number') next[key] = val;
          }
          setResponses(next);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '기존 응답을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingResult(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editResultId, code, accessCheckLoading, accessCheckError]);

  const handleAnswer = (value: number) => {
    const q = questions[currentIndex];
    if (!q) return;
    setResponses((prev) => ({ ...prev, [q.id]: value }));
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const canSubmit = canSubmitAuth && Object.keys(responses).length === questions.length;
  const returnToPortalProgress = hasPortal || fromPortal;

  const buildPortalProgressUrl = () => {
    let assessmentId = '';
    try {
      const raw = sessionStorage.getItem(JOIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { assessmentId?: string };
        assessmentId = (parsed.assessmentId || '').trim();
      }
    } catch {
      // ignore
    }
    const expandKey = assessmentId && testId ? `${assessmentId}:${testId}` : '';
    return buildPortalProgressReturnUrl(expandKey || undefined);
  };

  const navigateAfterSubmit = () => {
    if (returnToPortalProgress) {
      router.replace(buildPortalProgressUrl());
      return;
    }
    if (!hasParticipant) {
      router.push(`/join/profile?accessCode=${encodeURIComponent(code)}`);
      return;
    }
    navigateToJoinSelectionDashboard(code, router);
  };

  const navigateBackFromTest = () => {
    if (returnToPortalProgress) {
      router.replace(buildPortalProgressUrl());
      return;
    }
    navigateToJoinSelectionDashboard(code, router);
  };

  const handleSubmitNew = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      if (editResultId) {
        await updateClientResult(editResultId, { responses }, code);
      } else {
        await submitResult({ accessCode: code, testId, responses });
      }
      navigateAfterSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출에 실패했습니다.');
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return null;
  }

  if (!code || !isValidAccessCodeInput(code) || !testId) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-red-400 mb-4">잘못된 접근입니다.</p>
            <Link href="/join" className="text-blue-400 hover:text-blue-300">
              검사 코드 다시 입력
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (accessCheckLoading || (editResultId && loadingResult)) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-slate-300">
              {editResultId ? '기존 응답을 불러오는 중…' : '검사코드 사용 가능 여부를 확인 중입니다…'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (accessCheckError) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="pt-24 px-4">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-red-400 mb-4">{accessCheckError}</p>
            <Link href="/join" className="text-blue-400 hover:text-blue-300">
              검사 코드 다시 입력
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigateBackFromTest()}
              className="text-blue-400 hover:text-blue-300 text-sm bg-transparent border-0 cursor-pointer p-0 underline-offset-2 hover:underline text-left"
            >
              {hasPortal ? '← 내 검사실' : '← 검사 선택 현황'}
            </button>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">{title}</h1>

            {!hasPortal && !hasParticipant && accessCheckLoading ? (
              <p className="text-slate-400 text-sm mb-4">검사 세션 준비 중…</p>
            ) : !canSubmitAuth ? (
              <p className="text-amber-400/95 text-sm mb-4">검사 세션을 시작할 수 없습니다. 검사 코드 입력부터 다시 시도해 주세요.</p>
            ) : null}

            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-slate-400 text-sm mb-4">
              문항 {currentIndex + 1} / {questions.length}
            </p>

            {currentQuestion && (
              <div className="mb-8">
                <p className="text-white text-lg mb-6">{currentQuestion.question}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleAnswer(v)}
                      className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                        responses[currentQuestion.id] === v
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  1: {SCALE_LABELS[1]} · 7: {SCALE_LABELS[7]}
                </p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                이전
              </button>

              {currentIndex === questions.length - 1 && Object.keys(responses).length === questions.length ? (
                <button
                  type="button"
                  onClick={handleSubmitNew}
                  disabled={submitting || !canSubmitAuth}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '제출 중…' : editResultId ? '수정 완료' : '제출하기'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))}
                  disabled={currentIndex >= questions.length - 1}
                  className="px-4 py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-50"
                >
                  다음
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
