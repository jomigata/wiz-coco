'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { orgBulkCreate } from '@/lib/orgApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';

const DEFAULT_TESTS = [
  { testId: 'mbti_pro', name: 'MBTI Pro' },
  { testId: 'integrated-assessment', name: '통합 검사' },
];

export default function OrgDispatchPage() {
  const [cohortName, setCohortName] = useState('');
  const [title, setTitle] = useState('');
  const [rowsText, setRowsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const parseRows = () => {
    return rowsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        return {
          displayName: parts[0] || '내담자',
          email: parts[1] || '',
          phone: parts[2] || '',
        };
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const rows = parseRows();
    if (!cohortName.trim() || rows.length === 0) {
      setError('cohort 이름과 내담자 목록(1줄 1명)이 필요합니다.');
      setLoading(false);
      return;
    }
    const testList = DEFAULT_TESTS.filter((t) =>
      counselorAssessmentTestOptions.some((o) => o.testId === t.testId),
    );
    try {
      const result = await orgBulkCreate({
        cohortName: cohortName.trim(),
        title: title.trim() || cohortName.trim(),
        rows,
        testList: testList.length ? testList : DEFAULT_TESTS,
        queueNotify: false,
      });
      setMessage(
        `발송 완료 — cohort ${String(result.cohortId || '')}, ${rows.length}명 (기관 선결제·0원)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['org_admin', 'admin']}>
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/org/dashboard/" className="text-blue-400 text-sm hover:underline">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">기관 일괄 발송</h1>
        <p className="text-slate-400 text-sm mb-6">
          학급·부서 단위 cohort. 기관 크레딧이 차감되며 내담자는 별도 결제 없이 검사합니다.
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

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 p-6 bg-slate-900/50">
          <div>
            <label className="block text-sm text-slate-400 mb-1">학급/부서명 (cohort)</label>
            <input
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
              placeholder="예: 3학년 2반"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">검사 제목 (선택)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              내담자 목록 (이름, 이메일, 휴대폰 — 쉼표/탭 구분, 1줄 1명)
            </label>
            <textarea
              value={rowsText}
              onChange={(e) => setRowsText(e.target.value)}
              rows={8}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm font-mono"
              placeholder={'홍길동, student1@school.kr\n김철수'}
              required
            />
          </div>
          <p className="text-xs text-slate-500">
            포함 검사: {DEFAULT_TESTS.map((t) => t.name).join(', ')} (POC 기본)
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? '발송 중…' : '기관 크레딧으로 일괄 발송'}
          </button>
        </form>
      </div>
    </RoleGuard>
  );
}
