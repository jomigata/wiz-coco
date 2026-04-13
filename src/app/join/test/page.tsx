'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { submitResult } from '@/lib/assessmentApi';
import { isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { genericJoinQuestions } from '@/data/genericJoinQuestions';
import { JOIN_STORAGE_KEY, navigateToJoinSelectionDashboard } from '@/lib/joinAssessmentSession';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

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

  const [title, setTitle] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const code = normalizeAccessCodeInput(accessCode);
  const questions = genericJoinQuestions;

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAccessCode((params.get('accessCode') || '').trim());
      setTestId((params.get('testId') || '').trim());
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

  const isLoggedIn = !authLoading && !!user;

  const handleAnswer = (value: number) => {
    const q = questions[currentIndex];
    if (!q) return;
    setResponses((prev) => ({ ...prev, [q.id]: value }));
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const canSubmit = isLoggedIn && Object.keys(responses).length === questions.length;

  const handleSubmitNew = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await submitResult({ accessCode: code, testId, responses });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToMyRecords = () => {
    router.replace('/mypage?tab=records');
  };

  if (!hydrated) {
    return null;
  }

  if (!code || !isValidAccessCodeInput(code) || !testId) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
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

  if (done) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-4 pt-24"
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-submit-done-title"
        >
          <div className="max-w-lg w-full text-center bg-slate-800/95 rounded-2xl border border-slate-600 p-8 shadow-xl">
            <h2 id="join-submit-done-title" className="text-xl font-bold text-white mb-2">
              검사 완료
            </h2>
            <p className="text-slate-300 mb-6">검사가 완료되었습니다.</p>
            <button
              type="button"
              onClick={goToMyRecords}
              className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              닫기
            </button>
            <p className="text-slate-500 text-xs mt-4">마이페이지의 검사 기록으로 이동합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => navigateToJoinSelectionDashboard(code)}
              className="text-blue-400 hover:text-blue-300 text-sm bg-transparent border-0 cursor-pointer p-0 underline-offset-2 hover:underline text-left"
            >
              ← 검사 선택 현황
            </button>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">{title}</h1>

            {authLoading ? (
              <p className="text-slate-400 text-sm mb-4">로그인 확인 중…</p>
            ) : !isLoggedIn ? (
              <p className="text-amber-400/95 text-sm mb-4">
                로그인한 뒤 다시 이 검사를 열어 주세요.{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
                  로그인
                </Link>
                {' · '}
                <button
                  type="button"
                  onClick={() => navigateToJoinSelectionDashboard(code)}
                  className="text-blue-400 hover:text-blue-300 underline bg-transparent border-0 cursor-pointer p-0"
                >
                  검사 선택 현황
                </button>
              </p>
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
                  disabled={authLoading || !isLoggedIn || submitting}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '제출 중…' : '제출하기'}
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
