'use client';

import React, { useEffect, useState } from 'react';
import {
  fetchAiAdminUsageLedger,
  fetchAiAdminUsageSummary,
  fetchAdminCounselorAiCredits,
  grantCounselorAiCredits,
} from '@/lib/aiUsageApi';
import { PILOT_FREE_AI_CREDITS } from '@/data/aiPricingCatalog';
import type { AiAdminUsageSummary } from '@/types/aiUsage';

export default function AdminAiUsagePanel() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<AiAdminUsageSummary | null>(null);
  const [ledgerItems, setLedgerItems] = useState<
    Awaited<ReturnType<typeof fetchAiAdminUsageLedger>>['items']
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [grantUid, setGrantUid] = useState('');
  const [grantAmount, setGrantAmount] = useState(PILOT_FREE_AI_CREDITS);
  const [grantReason, setGrantReason] = useState('pilot_grant');
  const [grantMsg, setGrantMsg] = useState('');

  const [lookupUid, setLookupUid] = useState('');
  const [lookupResult, setLookupResult] = useState<
    Awaited<ReturnType<typeof fetchAdminCounselorAiCredits>> | null
  >(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      fetchAiAdminUsageSummary(month),
      fetchAiAdminUsageLedger({ month, limit: 50 }),
    ])
      .then(([s, l]) => {
        setSummary(s);
        setLedgerItems(l.items);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'AI 사용량 조회 실패'))
      .finally(() => setLoading(false));
  }, [month]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGrantMsg('');
    setError('');
    try {
      const result = await grantCounselorAiCredits({
        counselorUid: grantUid.trim(),
        amount: grantAmount,
        reason: grantReason,
      });
      setGrantMsg(`AI 크레딧 지급 완료: +${result.granted} → 잔액 ${result.balance}`);
      const s = await fetchAiAdminUsageSummary(month);
      setSummary(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : '지급 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const detail = await fetchAdminCounselorAiCredits(lookupUid.trim());
      setLookupResult(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  const featureRows = summary ? Object.values(summary.byFeature) : [];

  return (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm">
        AI 크레딧 지급 · 기능별 사용량 · 토큰 원장 모니터링 (Wave 3 T-3-08)
      </p>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">월 선택</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
        />
        {loading && <span className="text-xs text-slate-500">불러오는 중…</span>}
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-violet-500/20 p-4 bg-violet-950/20">
            <p className="text-xs text-violet-300">AI 크레딧 차감</p>
            <p className="text-2xl font-bold text-slate-900">{summary.creditsConsumed}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
            <p className="text-xs text-slate-400">AI 크레딧 지급</p>
            <p className="text-2xl font-bold text-slate-900">{summary.creditsGranted}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
            <p className="text-xs text-slate-400">활성 상담사</p>
            <p className="text-2xl font-bold text-slate-900">{summary.activeCounselors}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
            <p className="text-xs text-slate-400">총 토큰</p>
            <p className="text-2xl font-bold text-slate-900">{summary.tokensTotal.toLocaleString()}</p>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-900/50">
            <h3 className="text-white font-medium mb-3">기능별 사용</h3>
            <ul className="text-sm space-y-2">
              {featureRows.length === 0 && (
                <li className="text-slate-500">해당 기간 사용 내역 없음</li>
              )}
              {featureRows.map((row) => (
                <li key={row.feature} className="flex justify-between text-slate-300 gap-4">
                  <span>
                    {row.label}{' '}
                    <span className="text-slate-500">({row.count}건)</span>
                  </span>
                  <span className="text-right shrink-0">
                    -{row.creditsConsumed} / +{row.creditsGranted}
                    {row.tokens > 0 ? (
                      <span className="block text-xs text-slate-500">{row.tokens} tok</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-900/50">
            <h3 className="text-white font-medium mb-3">AI 지갑 상위</h3>
            <p className="text-xs text-slate-500 mb-2">
              전체 {summary.walletCount}지갑 · 합계 잔액 {summary.totalWalletBalance}
            </p>
            <ul className="text-sm space-y-2">
              {summary.topWallets.map((w) => (
                <li key={w.counselorUid} className="flex justify-between text-slate-300 font-mono text-xs">
                  <span className="truncate max-w-[200px]">{w.counselorUid}</span>
                  <span>{w.balance}</span>
                </li>
              ))}
              {summary.topWallets.length === 0 && (
                <li className="text-slate-500">잔액 보유 지갑 없음</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <form
        onSubmit={handleGrant}
        className="rounded-xl border border-violet-500/20 bg-white p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">AI 크레딧 지급</h2>
        <input
          value={grantUid}
          onChange={(e) => setGrantUid(e.target.value)}
          className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          placeholder="상담사 Firebase UID"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            min={1}
            max={100000}
            value={grantAmount}
            onChange={(e) => setGrantAmount(Number(e.target.value))}
            className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          />
          <input
            value={grantReason}
            onChange={(e) => setGrantReason(e.target.value)}
            className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-500 disabled:opacity-50"
        >
          AI 크레딧 지급 (파일럿 기본 {PILOT_FREE_AI_CREDITS})
        </button>
        {grantMsg && <p className="text-sm text-emerald-300">{grantMsg}</p>}
      </form>

      <form
        onSubmit={handleLookup}
        className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-slate-900">상담사 AI 잔액 조회</h2>
        <input
          value={lookupUid}
          onChange={(e) => setLookupUid(e.target.value)}
          className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          placeholder="상담사 UID"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 rounded-lg border border-slate-200 text-white text-sm hover:bg-slate-100"
        >
          조회
        </button>
        {lookupResult && (
          <div className="text-sm text-slate-300">
            <p>
              잔액: <span className="text-white font-semibold">{lookupResult.balance}</span>
              {lookupResult.email ? ` · ${lookupResult.email}` : ''}
            </p>
          </div>
        )}
      </form>

      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="min-w-full text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left">일시</th>
              <th className="px-3 py-2 text-left">상담사</th>
              <th className="px-3 py-2 text-left">기능</th>
              <th className="px-3 py-2 text-right">Δ</th>
              <th className="px-3 py-2 text-right">토큰</th>
            </tr>
          </thead>
          <tbody>
            {ledgerItems.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {row.createdAt?.slice(0, 16) || '—'}
                </td>
                <td className="px-3 py-2 font-mono text-xs max-w-[120px] truncate">
                  {row.counselorUid || row.clientId || '—'}
                </td>
                <td className="px-3 py-2">{row.feature || row.reason}</td>
                <td className="px-3 py-2 text-right">{row.delta}</td>
                <td className="px-3 py-2 text-right">{row.tokensTotal ?? '—'}</td>
              </tr>
            ))}
            {ledgerItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  원장 내역 없음
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
