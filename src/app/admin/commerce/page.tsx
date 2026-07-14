'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import {
  grantCounselorCredits,
  fetchCounselorCredits,
  fetchSettlementSummary,
  fetchPaymentHistory,
  type SettlementSummary,
  type PaymentRecord,
} from '@/lib/commerceApi';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';
import AdminAiUsagePanel from '@/components/admin/AdminAiUsagePanel';

type Tab = 'grant' | 'settlement' | 'ai';

export default function AdminCommercePage() {
  const [tab, setTab] = useState<Tab>('grant');
  const [counselorUid, setCounselorUid] = useState('');
  const [amount, setAmount] = useState(PILOT_FREE_CREDITS);
  const [reason, setReason] = useState('pilot_grant');
  const [lookupUid, setLookupUid] = useState('');
  const [lookupResult, setLookupResult] = useState<{
    balance: number;
    email?: string;
    ledger: { delta: number; reason: string; createdAt?: string; balanceAfter: number }[];
  } | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (tab !== 'settlement') return;
    setLoading(true);
    Promise.all([fetchSettlementSummary(month), fetchPaymentHistory(30)])
      .then(([s, p]) => {
        setSummary(s);
        setPayments(p);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '정산 조회 실패'))
      .finally(() => setLoading(false));
  }, [tab, month]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await grantCounselorCredits({
        counselorUid: counselorUid.trim(),
        amount,
        reason,
      });
      setMessage(`지급 완료: +${result.granted} → 잔액 ${result.balance}`);
      if (lookupUid.trim() === counselorUid.trim()) {
        const detail = await fetchCounselorCredits(counselorUid.trim());
        setLookupResult({
          balance: detail.balance,
          email: detail.email,
          ledger: detail.ledger || [],
        });
      }
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
      const detail = await fetchCounselorCredits(lookupUid.trim());
      setLookupResult({
        balance: detail.balance,
        email: detail.email,
        ledger: detail.ledger || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">협회 · 수익화 관리</h1>
        <p className="text-slate-400 text-sm mb-6">
          크레딧 지급(파일럿) · PG 결제 정산(2단계) · 월간 리포트
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setTab('grant')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'grant' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            크레딧 지급
          </button>
          <button
            type="button"
            onClick={() => setTab('settlement')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'settlement' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            정산 · 결제 내역
          </button>
          <button
            type="button"
            onClick={() => setTab('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === 'ai' ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-300'
            }`}
          >
            AI 사용량
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-900/40 border border-emerald-600/40 p-4 text-emerald-200 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {tab === 'grant' && (
          <>
            <form
              onSubmit={handleGrant}
              className="rounded-xl border border-slate-200 bg-white p-6 mb-8 space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-900">크레딧 지급</h2>
              <div>
                <label className="block text-sm text-slate-400 mb-1">상담사 UID</label>
                <input
                  value={counselorUid}
                  onChange={(e) => setCounselorUid(e.target.value)}
                  className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
                  placeholder="Firebase uid"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">수량</label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">사유</label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? '처리 중…' : `지급 (파일럿 기본 ${PILOT_FREE_CREDITS})`}
              </button>
            </form>

            <form
              onSubmit={handleLookup}
              className="rounded-xl border border-slate-200 bg-white p-6 mb-6 space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-900">잔액 · 내역 조회</h2>
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
            </form>

            {lookupResult && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-white font-semibold mb-1">잔액: {lookupResult.balance} 크레딧</p>
                {lookupResult.email && (
                  <p className="text-slate-400 text-sm mb-4">{lookupResult.email}</p>
                )}
                <h3 className="text-sm font-medium text-blue-200 mb-2">최근 내역</h3>
                <ul className="space-y-2 text-sm">
                  {lookupResult.ledger.map((row, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-slate-300 border-b border-slate-100 pb-2"
                    >
                      <span>
                        {row.delta > 0 ? '+' : ''}
                        {row.delta} · {row.reason}
                      </span>
                      <span className="text-slate-500">잔액 {row.balanceAfter}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {tab === 'ai' && <AdminAiUsagePanel />}

        {tab === 'settlement' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">월 선택</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
              />
            </div>

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">결제 건수</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.paymentCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">총 매출</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {summary.totalAmount.toLocaleString()}원
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">발급 크레딧</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.totalCreditsGranted}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">
                    플랫폼 수수료 ({Math.round(summary.platformFeeRate * 100)}%)
                  </p>
                  <p className="text-2xl font-bold text-amber-300">
                    {summary.platformFeeAmount.toLocaleString()}원
                  </p>
                </div>
              </div>
            )}

            {summary && Object.keys(summary.byProduct).length > 0 && (
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-900/50">
                <h3 className="text-white font-medium mb-3">상품별</h3>
                <ul className="text-sm space-y-2">
                  {Object.entries(summary.byProduct).map(([pid, row]) => (
                    <li key={pid} className="flex justify-between text-slate-300">
                      <span>{pid}</span>
                      <span>
                        {row.count}건 · {row.amount.toLocaleString()}원 · {row.credits}크레딧
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="min-w-full text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left">일시</th>
                    <th className="px-3 py-2 text-left">상품</th>
                    <th className="px-3 py-2 text-right">금액</th>
                    <th className="px-3 py-2 text-right">크레딧</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{p.createdAt?.slice(0, 16) || '—'}</td>
                      <td className="px-3 py-2">{p.productId || '—'}</td>
                      <td className="px-3 py-2 text-right">
                        {(p.amount || 0).toLocaleString()}원
                      </td>
                      <td className="px-3 py-2 text-right">{p.creditsGranted ?? '—'}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                        결제 내역 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
