'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  assessmentInterpretCreditCost,
  fetchAiReportsForResult,
  interpretAssessmentResult,
} from '@/lib/aiInterpretApi';

type Props = {
  resultId: string;
  testLabel?: string;
  clientLabel?: string;
  compact?: boolean;
};

function renderMarkdownLite(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return (
        <h4 key={i} className="mt-4 mb-2 text-sm font-semibold text-violet-200">
          {line.replace(/^##\s+/, '')}
        </h4>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="ml-4 text-slate-300 list-disc">
          {line.replace(/^-\s+/, '')}
        </li>
      );
    }
    if (!line.trim()) return <br key={i} />;
    return (
      <p key={i} className="text-slate-300 text-sm leading-relaxed">
        {line}
      </p>
    );
  });
}

export default function AssessmentAiInterpretButton({
  resultId,
  testLabel,
  clientLabel,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [cached, setCached] = useState(false);
  const [creditsCharged, setCreditsCharged] = useState(0);

  async function loadCached(): Promise<boolean> {
    try {
      const res = await fetchAiReportsForResult(resultId);
      const latest = res.reports?.[0];
      if (latest?.content) {
        setContent(latest.content);
        setTitle(latest.title || `${testLabel || '검사'} AI 해석`);
        setCached(true);
        setCreditsCharged(0);
        return true;
      }
    } catch {
      // 캐시 없음
    }
    return false;
  }

  const runInterpret = async (forceRegenerate?: boolean) => {
    setLoading(true);
    setError('');
    try {
      const res = await interpretAssessmentResult(resultId, { forceRegenerate });
      setContent(res.content);
      setTitle(res.title);
      setCached(res.cached);
      setCreditsCharged(res.creditsCharged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 해석 실패');
    } finally {
      setLoading(false);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    setError('');
    const hasCache = await loadCached();
    if (!hasCache) {
      await runInterpret(false);
    }
  };

  const creditCost = assessmentInterpretCreditCost(false);
  const regenCost = assessmentInterpretCreditCost(true);

  return (
    <>
      <div className={compact ? 'inline-flex gap-2' : 'flex flex-wrap gap-2'}>
        <button
          type="button"
          disabled={loading}
          onClick={() => void openPanel()}
          className={
            compact
              ? 'text-xs px-2 py-1 rounded border border-violet-400/40 text-violet-200 hover:bg-violet-950/40 disabled:opacity-50'
              : 'text-xs px-3 py-1.5 rounded-lg border border-violet-400/40 text-violet-200 hover:bg-violet-950/40 disabled:opacity-50'
          }
        >
          {loading ? '생성 중…' : `AI 해석 (${creditCost} 크레딧)`}
        </button>
      </div>

      {error && !open && (
        <p className="text-xs text-red-300 mt-1">{error}</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-violet-500/30 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{title || 'AI 해석 리포트'}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {testLabel || '검사'}
                  {clientLabel ? ` · ${clientLabel}` : ''}
                  {cached ? ' · 캐시 (무료 열람)' : creditsCharged > 0 ? ` · ${creditsCharged} AI 크레딧 차감` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>

            {loading && !content ? (
              <p className="text-slate-400 text-sm py-8 text-center">AI가 검사 결과를 분석하는 중…</p>
            ) : error ? (
              <p className="text-red-300 text-sm">{error}</p>
            ) : (
              <div className="prose prose-invert max-w-none text-sm">{renderMarkdownLite(content)}</div>
            )}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {content && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void runInterpret(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  재생성 ({regenCost} 크레딧, 50% 할인)
                </button>
              )}
              <Link
                href="/counselor/credits"
                className="text-xs px-3 py-1.5 rounded-lg text-violet-300 hover:text-violet-200"
              >
                AI 크레딧 충전 →
              </Link>
            </div>

            <p className="mt-4 text-[11px] text-slate-600">
              본 해석은 진단이 아닌 상담 참고 자료입니다. 고위험 징후 시 대면 전문가 평가를 권장합니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
