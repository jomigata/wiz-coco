'use client';

import AdminPageLayout from '@/components/AdminPageLayout';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import React, { useEffect, useMemo, useState } from 'react';

type CounselorResultRow = {
  id: string;
  uid?: string;
  email?: string | null;
  testType?: string;
  code?: string;
  status?: string;
  createdAt?: any;
  counselorCode?: string;
};

function formatCreatedAt(v: any): string {
  const d =
    v?.toDate?.() instanceof Date
      ? v.toDate()
      : v?.seconds
        ? new Date(Number(v.seconds) * 1000)
        : typeof v === 'string'
          ? new Date(v)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function TestResultsPage() {
  const { user, loading } = useFirebaseAuth();
  const [rows, setRows] = useState<CounselorResultRow[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queryText, setQueryText] = useState('');

  useEffect(() => {
    const run = async () => {
      if (loading) return;
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const { queryDocuments } = await import('@/utils/firebaseFirestore');
        const docs = await queryDocuments(
          'testResults',
          [{ field: 'counselorId', operator: '==', value: user.uid }],
          'createdAt',
          'desc',
          200
        );
        setRows((docs || []).map((d: any) => ({ id: d.id, ...d })));
      } catch (e: any) {
        console.error('[CounselorTestResults] load failed', e);
        setError('검사 결과를 불러오지 못했습니다. 권한/규칙을 확인해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [user?.uid, loading]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.email || '',
        r.uid || '',
        r.testType || '',
        r.code || '',
        r.counselorCode || '',
        r.status || '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, queryText]);

  return (
    <AdminPageLayout title="검사 결과 분석">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="이메일/UID/검사명/코드로 검색"
            className="w-full max-w-md px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder-white/40"
          />
          <div className="text-sm text-white/70">
            총 <span className="text-white font-semibold">{filtered.length}</span>건
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-white/70 text-sm">불러오는 중…</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm text-white/90">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-3 py-2 text-left">일시</th>
                  <th className="px-3 py-2 text-left">내담자</th>
                  <th className="px-3 py-2 text-left">검사</th>
                  <th className="px-3 py-2 text-left">상태</th>
                  <th className="px-3 py-2 text-left">코드</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-3 py-2 whitespace-nowrap">{formatCreatedAt(r.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="text-white">{r.email || '—'}</div>
                      <div className="text-xs text-white/50">{r.uid || '—'}</div>
                    </td>
                    <td className="px-3 py-2">{r.testType || '—'}</td>
                    <td className="px-3 py-2">{r.status || 'completed'}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-white/70">{r.code || '—'}</div>
                      {r.counselorCode && <div className="text-xs text-white/40">연결코드: {r.counselorCode}</div>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-white/60" colSpan={5}>
                      표시할 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
