'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchMiniCheckQuestions,
  scoreMiniCheck,
  type MiniCheckQuestion,
  type MiniCheckResult,
} from '@/lib/b2cApi';

export default function MiniCheckQuiz() {
  const [questions, setQuestions] = useState<MiniCheckQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<MiniCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMiniCheckQuestions()
      .then(setQuestions)
      .catch(() => setError('문항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const current = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

  const handleSelect = (value: number) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const handleNext = async () => {
    if (!current || answers[current.id] == null) return;
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const scored = await scoreMiniCheck(answers);
      setResult(scored);
    } catch {
      setError('결과 계산에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400 text-center py-12">미니 검사 준비 중…</p>;
  }

  if (result) {
    const tierLabel =
      result.recommendedTier === 'premium'
        ? 'Premium'
        : result.recommendedTier === 'pro'
          ? 'Pro'
          : 'Basic';
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-white/10 bg-slate-900/80 p-8">
        <p className="text-sm text-violet-300 mb-2">3분 마음 체크 결과</p>
        <h2 className="text-2xl font-bold text-white mb-4">{result.hookMessage}</h2>
        <p className="text-slate-300 mb-6">{result.summary}</p>
        <p className="text-xs text-slate-500 mb-6">{result.disclaimer}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/discover/shop/?tier=${result.recommendedTier}`}
            className="flex-1 text-center py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500"
          >
            {tierLabel} 리포트 보기
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setStep(0);
              setAnswers({});
            }}
            className="flex-1 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5"
          >
            다시 하기
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-6">
          내담자·SNS에 공유 —{' '}
          <button
            type="button"
            className="text-violet-300 underline"
            onClick={() => {
              const url = `${window.location.origin}/discover/mini-check/`;
              if (navigator.share) {
                navigator.share({ title: 'WizCoCo 3분 마음 체크', url }).catch(() => undefined);
              } else {
                void navigator.clipboard.writeText(url);
                alert('링크가 복사되었습니다.');
              }
            }}
          >
            링크 복사 / 공유
          </button>
        </p>
      </div>
    );
  }

  if (!current) {
    return <p className="text-red-300 text-center">{error || '문항 없음'}</p>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="h-1.5 rounded-full bg-white/10 mb-8 overflow-hidden">
        <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-sm text-slate-400 mb-2">
        {step + 1} / {questions.length}
      </p>
      <h2 className="text-xl font-semibold text-white mb-6">{current.text}</h2>
      <div className="space-y-2 mb-8">
        {current.choices.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => handleSelect(c.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
              answers[current.id] === c.value
                ? 'border-violet-400 bg-violet-950/50 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/25'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
      <button
        type="button"
        disabled={answers[current.id] == null || submitting}
        onClick={handleNext}
        className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold disabled:opacity-40"
      >
        {submitting ? '계산 중…' : step < questions.length - 1 ? '다음' : '결과 보기'}
      </button>
    </div>
  );
}
