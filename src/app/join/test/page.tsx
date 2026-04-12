'use client';

import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { submitResult, updateResult } from '@/lib/assessmentApi';
import {
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';
import { genericJoinQuestions } from '@/data/genericJoinQuestions';
import { JOIN_CLIENT_EMAIL_KEY, readJoinClientEmail } from '@/lib/joinClientEmailStorage';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';
const EDIT_RESULT_STORAGE_KEY = 'wizcoco_edit_result';

/** 검사 선택 현황(`/join/dashboard`) — 세션의 PIN을 해시로 넘기면 대시보드에서 복구 가능 */
function joinSelectionDashboardHref(accessCodeNorm: string): string {
  const base = `/join/dashboard?accessCode=${encodeURIComponent(accessCodeNorm)}`;
  if (typeof window === 'undefined') return base;
  try {
    const raw = sessionStorage.getItem(JOIN_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as { accessCode?: unknown; joinPin?: unknown };
    if (normalizeAccessCodeInput(String(parsed.accessCode ?? '')) !== accessCodeNorm) return base;
    const pin = normalizeJoinPinDigits(parsed.joinPin);
    if (pin.length === 4) return `${base}#p=${encodeURIComponent(pin)}`;
  } catch {
    /* ignore */
  }
  return base;
}

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
  const [accessCode, setAccessCode] = useState('');
  const [testId, setTestId] = useState('');

  const [title, setTitle] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [editResultId, setEditResultId] = useState<string | null>(null);
  const [editPasswordModal, setEditPasswordModal] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [submitDoneInfo, setSubmitDoneInfo] = useState<{
    emailSent?: boolean;
    plainPassword?: string;
  } | null>(null);

  const code = normalizeAccessCodeInput(accessCode);
  const questions = genericJoinQuestions;
  const isEditMode = !!editResultId;

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

  useEffect(() => {
    const bump = () => setStorageTick((t) => t + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === JOIN_CLIENT_EMAIL_KEY || e.key === null) bump();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') bump();
    };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', bump);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_RESULT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { resultId: string; testId: string; responses?: Record<string, number> };
      if (String(parsed.testId) !== String(testId)) return;
      setEditResultId(parsed.resultId);
      if (parsed.responses && typeof parsed.responses === 'object') {
        const r = parsed.responses as Record<string, number>;
        setResponses(r);
        const lastIdx = questions.reduce((max, q, i) => (r[q.id] !== undefined ? i : max), 0);
        setCurrentIndex(lastIdx);
      }
      sessionStorage.removeItem(EDIT_RESULT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [testId]);

  /** React state 대신 저장소를 직접 읽어 적용 직후에도 경고가 남는 문제 방지 */
  const effectiveEmail = useMemo(
    () => (hydrated ? readJoinClientEmail() : ''),
    [hydrated, storageTick]
  );

  const handleAnswer = (value: number) => {
    const q = questions[currentIndex];
    if (!q) return;
    setResponses((prev) => ({ ...prev, [q.id]: value }));
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const canSubmit = effectiveEmail.includes('@') && Object.keys(responses).length === questions.length;

  const handleSubmitNew = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const data = await submitResult({ accessCode: code, testId, clientEmail: effectiveEmail, responses });
      setSubmitDoneInfo({
        emailSent: data.emailSent,
        plainPassword: typeof data.plainPassword === 'string' ? data.plainPassword : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editResultId || editPassword.length !== 4) return;
    setError('');
    setSubmitting(true);
    try {
      await updateResult(editResultId, { password: editPassword, responses });
      setEditPasswordModal(false);
      setEditPassword('');
      setSubmitDoneInfo(null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

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
              {isEditMode ? '수정 완료' : '제출 완료'}
            </h2>
            {isEditMode ? (
              <p className="text-slate-300 mb-6">결과가 수정되었습니다.</p>
            ) : submitDoneInfo?.emailSent === false ? (
              <div className="text-left mb-6 space-y-4">
                <p className="text-amber-200 text-sm">
                  서버에서 이메일을 보내지 못했습니다. (SMTP 미설정 또는 발송 오류) 운영 환경에서는 Cloud Run 등에{' '}
                  <code className="text-slate-300">SMTP_HOST</code>, <code className="text-slate-300">SMTP_USER</code>,{' '}
                  <code className="text-slate-300">SMTP_PASSWORD</code>, <code className="text-slate-300">MAIL_FROM</code>을
                  설정해야 메일이 발송됩니다.
                </p>
                {submitDoneInfo.plainPassword ? (
                  <div className="rounded-lg bg-slate-900/80 border border-amber-600/50 p-4">
                    <p className="text-slate-400 text-sm mb-2">결과 수정·삭제에 필요한 4자리 비밀번호(이 화면에서만 표시됩니다)</p>
                    <p className="font-mono text-3xl tracking-[0.4em] text-white text-center">{submitDoneInfo.plainPassword}</p>
                    <p className="text-slate-500 text-xs mt-2">반드시 메모해 두세요.</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-slate-300 mb-6">
                결과와 4자리 비밀번호가 입력하신 이메일로 발송됩니다. 메일이 오지 않으면 스팸함을 확인해 주세요. 비밀번호는 결과
                수정·삭제 시 필요합니다.
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push(joinSelectionDashboardHref(code))}
              className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              닫기
            </button>
            <p className="text-slate-500 text-xs mt-4">검사 선택 화면(대시보드)으로 이동합니다.</p>
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
            <Link
              href={joinSelectionDashboardHref(code)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← 검사 선택 현황
            </Link>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">
              {title}
              {isEditMode && <span className="text-blue-400 text-sm ml-2">(수정)</span>}
            </h1>

            {effectiveEmail.includes('@') ? (
              <p className="text-slate-400 text-sm mb-4">
                제출 이메일: <span className="text-slate-200">{effectiveEmail}</span>
                <span className="text-slate-500"> (대시보드 「내 이메일」 적용값)</span>
              </p>
            ) : (
              <p className="text-amber-400/95 text-sm mb-4">
                대시보드에서 「내 이메일」을 입력하고 적용한 뒤 다시 이 검사를 열어 주세요.{' '}
                <Link href={joinSelectionDashboardHref(code)} className="text-blue-400 hover:text-blue-300 underline">
                  검사 선택 현황으로 이동
                </Link>
              </p>
            )}

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
                  onClick={() => {
                    if (!canSubmit) return;
                    if (isEditMode) return setEditPasswordModal(true);
                    handleSubmitNew();
                  }}
                  disabled={!effectiveEmail.includes('@') || submitting}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '제출 중…' : isEditMode ? '수정 제출' : '제출하기'}
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

          {editPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !submitting && setEditPasswordModal(false)}>
              <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-lg font-semibold text-white mb-2">수정 제출</h4>
                <p className="text-slate-300 text-sm mb-4">4자리 비밀번호를 입력하세요.</p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  placeholder="4자리 비밀번호"
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white mb-2"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => !submitting && setEditPasswordModal(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700">
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitEdit}
                    disabled={submitting || editPassword.length !== 4}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '처리 중…' : '수정 제출'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

