'use client';

import React, { useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { grantCounselorCredits, fetchCounselorCredits } from '@/lib/commerceApi';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';

export default function AdminCommercePage() {
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
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">협회 · 크레딧 관리</h1>
        <p className="text-slate-400 text-sm mb-8">
          1단계 파일럿: 상담사에게 검사 크레딧(내담자 1명 = 1크레딧)을 지급합니다. 사용자 UID는
          사용자 관리에서 확인하세요.
        </p>

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

        <form
          onSubmit={handleGrant}
          className="rounded-xl border border-white/10 bg-slate-900/80 p-6 mb-8 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">크레딧 지급</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">상담사 UID</label>
            <input
              value={counselorUid}
              onChange={(e) => setCounselorUid(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
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
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">사유</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
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
          className="rounded-xl border border-white/10 bg-slate-900/80 p-6 mb-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">잔액 · 내역 조회</h2>
          <input
            value={lookupUid}
            onChange={(e) => setLookupUid(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
            placeholder="상담사 UID"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="py-2 px-4 rounded-lg border border-white/20 text-white text-sm hover:bg-white/10"
          >
            조회
          </button>
        </form>

        {lookupResult && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white font-semibold mb-1">
              잔액: {lookupResult.balance} 크레딧
            </p>
            {lookupResult.email && (
              <p className="text-slate-400 text-sm mb-4">{lookupResult.email}</p>
            )}
            <h3 className="text-sm font-medium text-blue-200 mb-2">최근 내역</h3>
            <ul className="space-y-2 text-sm">
              {lookupResult.ledger.length === 0 && (
                <li className="text-slate-500">내역 없음</li>
              )}
              {lookupResult.ledger.map((row, i) => (
                <li key={i} className="flex justify-between text-slate-300 border-b border-white/5 pb-2">
                  <span>
                    {row.delta > 0 ? '+' : ''}
                    {row.delta} · {row.reason}
                  </span>
                  <span className="text-slate-500">
                    잔액 {row.balanceAfter}
                    {row.createdAt ? ` · ${row.createdAt.slice(0, 10)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-500">
          COMMERCE_CREDITS_ENFORCE=false(기본)일 때 크레딧 부족해도 발송 가능(경고만). enforce
          활성화 시 402 반환.
        </p>
      </div>
    </RoleGuard>
  );
}
