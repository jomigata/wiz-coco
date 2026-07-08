'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCounselorAiCredits } from '@/lib/aiUsageApi';
import { AI_PRICING_CATALOG, PILOT_FREE_AI_CREDITS } from '@/data/aiPricingCatalog';
import type { CounselorAiCreditsMeResponse } from '@/types/aiUsage';

export default function CounselorAiCreditsPanel() {
  const [data, setData] = useState<CounselorAiCreditsMeResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    fetchCounselorAiCredits()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : '조회 실패'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading && !data) {
    return <p className="text-slate-400 text-sm py-8 text-center">AI 크레딧 정보를 불러오는 중…</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
          {error}
        </div>
      )}

      <p className="text-slate-400 text-sm mb-6">
        검사 크레딧과 별도인 AI 전용 지갑입니다. 파일럿 상담사는 협회에서 최대{' '}
        {data?.pilotFreeAiCredits ?? PILOT_FREE_AI_CREDITS} AI 크레딧을 지급받을 수 있습니다.
      </p>

      {data && (
        <>
          <div className="rounded-xl border border-violet-500/30 bg-violet-950/30 p-6 mb-6">
            <p className="text-sm text-violet-200 mb-1">AI 크레딧 잔액</p>
            <p className="text-4xl font-bold text-white">{data.balance}</p>
            {data.enforceCredits ? (
              <p className="text-xs text-amber-300 mt-2">AI 크레딧 부족 시 AI 기능이 차단됩니다.</p>
            ) : (
              <p className="text-xs text-slate-400 mt-2">
                파일럿 모드: AI 크레딧 부족 시에도 일부 기능 사용 가능(정책 전환 예정).
              </p>
            )}
          </div>

          <h2 className="text-lg font-semibold text-white mb-3">AI 기능 단가</h2>
          <ul className="space-y-2 text-sm mb-8">
            {AI_PRICING_CATALOG.filter((item) => item.credits > 0).map((item) => (
              <li
                key={item.feature}
                className="rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-slate-300"
              >
                <div className="flex justify-between gap-4">
                  <span className="font-medium text-white">{item.label}</span>
                  <span className="text-violet-300 shrink-0">{item.credits} AI 크레딧</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              </li>
            ))}
          </ul>

          <h2 className="text-lg font-semibold text-white mb-3">최근 AI 사용 내역</h2>
          <ul className="space-y-2 text-sm">
            {(data.ledger || []).length === 0 && (
              <li className="text-slate-500">아직 AI 사용 내역이 없습니다.</li>
            )}
            {(data.ledger || []).map((row) => (
              <li
                key={row.id}
                className="flex flex-col sm:flex-row sm:justify-between gap-1 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-slate-300"
              >
                <span>
                  {row.delta > 0 ? '+' : ''}
                  {row.delta} · {row.reason}
                  {row.tokensTotal ? (
                    <span className="text-slate-500 ml-2">({row.tokensTotal} tokens)</span>
                  ) : null}
                </span>
                <span className="text-slate-500">잔액 {row.balanceAfter}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
