'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AssessmentList from '@/components/counselor/AssessmentList';
import { listAssessments, type CounselorAssessment } from '@/lib/assessmentApi';

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState<CounselorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setCreatedCode(params.get('code'));
    } catch {
      setCreatedCode(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listAssessments()
      .then((data) => {
        if (!cancelled) setAssessments(data.assessments || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '목록 조회 실패');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">참여 코드 패키지</h1>
        <Link
          href="/counselor/assessments/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
        >
          새 패키지 만들기
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-400">불러오는 중…</p>
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
          {error}
          <p className="text-sm mt-2">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
        </div>
      ) : (
        <AssessmentList assessments={assessments} createdCode={createdCode} />
      )}
    </div>
  );
}
