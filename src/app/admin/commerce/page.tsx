'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import AdminCounselorCreditGrantPanel from '@/components/admin/AdminCounselorCreditGrantPanel';
import {
  fetchSettlementSummary,
  fetchPaymentHistory,
  type SettlementSummary,
  type PaymentRecord,
} from '@/lib/commerceApi';
import AdminAiUsagePanel from '@/components/admin/AdminAiUsagePanel';

type Tab = 'grant' | 'settlement' | 'ai';

export default function AdminCommercePage() {
  const [tab, setTab] = useState<Tab>('grant');
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

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">협회 · 수익화 관리</h1>
        <p className="text-slate-400 text-sm mb-6">
          상담사 검사 크레딧 지급 · PG 결제 정산 · AI 사용량
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
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

        {error && tab === 'settlement' ? (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
            {error}
          </div>
        ) : null}

        {tab === 'grant' && <AdminCounselorCreditGrantPanel />}

        {tab === 'ai' && <AdminAiUsagePanel />}

        {tab === 'settlement' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-400">월 선택</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
              />
            </div>

            {loading ? <p className="text-slate-400 text-sm">불러오는 중…</p> : null}

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">결제 건수</p>
                  <p className="text-2xl font-bold text-white">{summary.paymentCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">총 매출</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.totalAmount.toLocaleString()}원
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
                  <p className="text-xs text-slate-400">발급 크레딧</p>
                  <p className="text-2xl font-bold text-white">{summary.totalCreditsGranted}</p>
                </div>
                <div className="rounded-xl border border-white/10 p-4 bg-white/5">
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
              <div className="rounded-xl border border-white/10 p-4 bg-slate-900/50">
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

            <div className="rounded-xl border border-white/10 overflow-x-auto">
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
                    <tr key={p.id} className="border-t border-white/5">
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
