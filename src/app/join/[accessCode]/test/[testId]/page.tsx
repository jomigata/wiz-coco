'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { submitResult, updateResult } from '@/lib/assessmentApi';
import { genericJoinQuestions } from '@/data/genericJoinQuestions';

const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';
const JOIN_EMAIL_KEY = 'wizcoco_join_client_email';
const EDIT_RESULT_STORAGE_KEY = 'wizcoco_edit_result';

// 1~7 리커트 스케일
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
  const params = useParams();
  const router = useRouter();
  const accessCode = (params?.accessCode as string) || '';
  const testId = (params?.testId as string) || '';
  const [title, setTitle] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  /** 수정 모드: 기존 결과 덮어쓰기 (resultId 있으면 PUT 제출) */
  const [editResultId, setEditResultId] = useState<string | null>(null);
  const [editPasswordModal, setEditPasswordModal] = useState(false);
  const [editPassword, setEditPassword] = useState('');

  const code = (accessCode || '').trim().toUpperCase();
  const questions = genericJoinQuestions;
  const isEditMode = !!editResultId;

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = typeof window !== 'undefined' ? sessionStorage.getItem(JOIN_STORAGE_KEY) : null;
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
    try {
      const saved = typeof window !== 'undefined' ? sessionStorage.getItem(JOIN_EMAIL_KEY) : null;
      if (saved) setClientEmail(saved);
    } catch {
      // ignore
    }
  }, []);

  // 수정 모드: 저장된 편집 데이터 로드 (resultId, testId, responses)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(EDIT_RESULT_STORAGE_KEY) : null;
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

  const [emailInput, setEmailInput] = useState('');
  const effectiveEmail = (emailInput || clientEmail || '').trim().toLowerCase();

  const handleAnswer = (value: number) => {
    const q = questions[currentIndex];
    if (!q) return;
    setResponses((prev) => ({ ...prev, [q.id]: value }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const canSubmit =
    effectiveEmail.includes('@') &&
    Object.keys(responses).length === questions.length;

  const handleSubmitClick = () => {
    if (!canSubmit) return;
    if (isEditMode) {
      setEditPasswordModal(true);
      return;
    }
    handleSubmitNew();
  };

  const handleSubmitNew = async () => {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await submitResult({
        accessCode: code,
        testId,
        clientEmail: effectiveEmail,
        responses,
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
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="pt-24 pb-12 px-4">
          <div className="max-w-lg mx-auto text-center bg-slate-800/80 rounded-2xl border border-slate-600 p-8">
            <h2 className="text-xl font-bold text-white mb-2">{isEditMode ? '수정 완료' : '제출 완료'}</h2>
            <p className="text-slate-300 mb-6">
              {isEditMode
                ? '결과가 수정되었습니다.'
                : '결과와 4자리 비밀번호가 이메일로 발송됩니다. 비밀번호는 결과 수정·삭제 시 필요합니다.'}
            </p>
            <Link
              href={`/join/${code}`}
              className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              대시보드로 돌아가기
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
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      <div className="pt-24 pb-12 px-4">
        <main className="max-w-2xl mx-auto">
          <div className="mb-4">
            <Link
              href={`/join/${code}`}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              ← 대시보드
            </Link>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-600 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-white mb-2">
              {title}
              {isEditMode && <span className="text-blue-400 text-sm ml-2">(수정)</span>}
            </h1>

            {/* 이메일 필수 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                이메일 <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={emailInput || clientEmail}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            {/* 진행률 */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-400 text-sm mb-4">
              문항 {currentIndex + 1} / {questions.length}
            </p>

            {/* 현재 문항 */}
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
                  onClick={handleSubmitClick}
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

          {/* 수정 제출 시 4자리 비밀번호 모달 */}
          {editPasswordModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => !submitting && setEditPasswordModal(false)}
            >
              <div
                className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-sm w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
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
                  <button
                    type="button"
                    onClick={() => !submitting && setEditPasswordModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700"
                  >
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
