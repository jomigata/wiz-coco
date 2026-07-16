'use client';

import { useCallback, useEffect, useState } from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
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
    return <p className="py-8 text-center text-sm text-slate-400">AI 크레딧 정보를 불러오는 중…</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div className="rounded-lg border border-red-600/40 bg-red-900/40 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <p className="text-sm text-slate-400">
        검사 크레딧과 별도인 AI 전용 지갑입니다. 파일럿 상담사는 협회에서 최대{' '}
        {data?.pilotFreeAiCredits ?? PILOT_FREE_AI_CREDITS} AI 크레딧을 지급받을 수 있습니다.
      </p>

      {data ? (
        <>
          <CounselorPageSection title="AI 크레딧 잔액">
            <p className="text-4xl font-bold text-white">{data.balance}</p>
            {data.enforceCredits ? (
              <p className="mt-2 text-xs text-amber-300">AI 크레딧 부족 시 AI 기능이 차단됩니다.</p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                파일럿 모드: AI 크레딧 부족 시에도 일부 기능 사용 가능(정책 전환 예정).
              </p>
            )}
          </CounselorPageSection>

          <CounselorPageSection title="AI 기능 단가">
            <ul className="space-y-2 text-sm">
              {AI_PRICING_CATALOG.filter((item) => item.credits > 0).map((item) => (
                <li
                  key={item.feature}
                  className="rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-slate-300"
                >
                  <div className="flex justify-between gap-4">
                    <span className="font-medium text-white">{item.label}</span>
                    <span className="shrink-0 text-violet-300">{item.credits} AI 크레딧</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                </li>
              ))}
            </ul>
          </CounselorPageSection>

          <CounselorPageSection title="최근 AI 사용 내역">
            <ul className="space-y-2 text-sm">
              {(data.ledger || []).length === 0 && (
                <li className="text-slate-500">아직 AI 사용 내역이 없습니다.</li>
              )}
              {(data.ledger || []).map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-slate-300 sm:flex-row sm:justify-between"
                >
                  <span>
                    {row.delta > 0 ? '+' : ''}
                    {row.delta} · {row.reason}
                    {row.tokensTotal ? (
                      <span className="ml-2 text-slate-500">({row.tokensTotal} tokens)</span>
                    ) : null}
                  </span>
                  <span className="text-slate-500">잔액 {row.balanceAfter}</span>
                </li>
              ))}
            </ul>
          </CounselorPageSection>
        </>
      ) : null}
    </div>
  );
}
