'use client';

import React, { useState } from 'react';
import { PILOT_FREE_CREDITS } from '@/data/monetizationCatalog';
import {
  grantCounselorCredits,
  lookupCounselorCredits,
  type CreditLedgerEntry,
} from '@/lib/commerceApi';

const PRESET_AMOUNTS = [10000, 50000, 100000] as const;

const REASON_OPTIONS = [
  { value: 'admin_grant', label: '관리자 지급' },
  { value: 'pilot_grant', label: '파일럿 지급' },
  { value: 'compensation', label: '보상·환불' },
] as const;

type LookupState = {
  counselorUid: string;
  email: string;
  displayName?: string;
  role?: string;
  balance: number;
  ledger: CreditLedgerEntry[];
};

export default function AdminCounselorCreditGrantPanel() {
  const [email, setEmail] = useState('');
  const [counselorUid, setCounselorUid] = useState('');
  const [amount, setAmount] = useState(PILOT_FREE_CREDITS);
  const [reason, setReason] = useState('admin_grant');
  const [lookup, setLookup] = useState<LookupState | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshLookup = async (uid: string) => {
    const detail = await lookupCounselorCredits({ counselorUid: uid });
    setLookup({
      counselorUid: detail.counselorUid,
      email: detail.email || email.trim().toLowerCase(),
      displayName: detail.displayName,
      role: detail.role,
      balance: detail.balance,
      ledger: detail.ledger || [],
    });
    setCounselorUid(uid);
  };

  const handleLookupByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('상담사 이메일을 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const detail = await lookupCounselorCredits({ email: trimmed });
      setLookup({
        counselorUid: detail.counselorUid,
        email: detail.email || trimmed,
        displayName: detail.displayName,
        role: detail.role,
        balance: detail.balance,
        ledger: detail.ledger || [],
      });
      setCounselorUid(detail.counselorUid);
    } catch (err) {
      setLookup(null);
      setError(err instanceof Error ? err.message : '조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupByUid = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = counselorUid.trim();
    if (!uid) {
      setError('상담사 UID를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await refreshLookup(uid);
    } catch (err) {
      setLookup(null);
      setError(err instanceof Error ? err.message : '조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = (lookup?.counselorUid || counselorUid).trim();
    const targetEmail = (lookup?.email || email).trim().toLowerCase();
    if (!uid && !targetEmail) {
      setError('먼저 상담사를 조회해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await grantCounselorCredits({
        counselorUid: uid || undefined,
        counselorEmail: uid ? undefined : targetEmail,
        amount,
        reason,
      });
      setMessage(`지급 완료: +${result.granted.toLocaleString()} → 잔액 ${result.balance.toLocaleString()}`);
      if (uid) {
        await refreshLookup(uid);
      } else if (targetEmail) {
        const detail = await lookupCounselorCredits({ email: targetEmail });
        setLookup({
          counselorUid: detail.counselorUid,
          email: detail.email || targetEmail,
          displayName: detail.displayName,
          role: detail.role,
          balance: detail.balance,
          ledger: detail.ledger || [],
        });
        setCounselorUid(detail.counselorUid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '지급 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/40 p-4 text-sm text-emerald-200">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-600/40 bg-red-900/40 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleLookupByEmail}
        className="rounded-xl border border-white/10 bg-slate-900/80 p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">상담사 찾기 (이메일)</h2>
        <p className="text-sm text-slate-400">이메일로 상담사를 찾은 뒤 검사 크레딧을 지급합니다.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white"
            placeholder="상담사 이메일 (예: name@naver.com)"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? '조회 중…' : '조회'}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleGrant}
        className="rounded-xl border border-blue-500/25 bg-slate-900/80 p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">검사 크레딧 지급</h2>

        {lookup ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-semibold text-white">
              {(lookup.displayName || lookup.email || lookup.counselorUid).trim()}
            </p>
            <p className="mt-1 text-slate-400">{lookup.email}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">{lookup.counselorUid}</p>
            <p className="mt-3 text-cyan-200">
              현재 잔액: <span className="text-xl font-bold text-white">{lookup.balance.toLocaleString()}</span> 크레딧
            </p>
          </div>
        ) : (
          <p className="text-sm text-amber-200/90">지급 전에 이메일로 상담사를 조회해 주세요.</p>
        )}

        <div>
          <label className="mb-2 block text-sm text-slate-400">지급 수량</label>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  amount === preset
                    ? 'bg-blue-600 text-white'
                    : 'border border-white/15 text-slate-300 hover:bg-white/5'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={100000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-400">사유</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !lookup}
          className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? '처리 중…' : `${amount.toLocaleString()} 크레딧 지급`}
        </button>
      </form>

      <form
        onSubmit={handleLookupByUid}
        className="rounded-xl border border-white/10 bg-slate-900/80 p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-white">UID로 조회 (고급)</h2>
        <input
          value={counselorUid}
          onChange={(e) => setCounselorUid(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white font-mono"
          placeholder="Firebase UID"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
        >
          UID 조회
        </button>
      </form>

      {lookup && lookup.ledger.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-3 text-sm font-medium text-blue-200">최근 내역</h3>
          <ul className="space-y-2 text-sm">
            {lookup.ledger.map((row) => (
              <li
                key={row.id}
                className="flex justify-between border-b border-white/5 pb-2 text-slate-300"
              >
                <span>
                  {row.delta > 0 ? '+' : ''}
                  {row.delta.toLocaleString()} · {row.reason}
                </span>
                <span className="text-slate-500">잔액 {row.balanceAfter.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
