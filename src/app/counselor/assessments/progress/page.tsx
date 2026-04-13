'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProgressDashboard from '@/components/counselor/ProgressDashboard';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getProgress, listAssessments } from '@/lib/assessmentApi';
import type { ProgressByClient } from '@/lib/assessmentApi';

export default function ProgressDashboardPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [assessmentId, setAssessmentId] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [byClient, setByClient] = useState<
    ProgressByClient[]
  >([]);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      setAssessmentId((params.get('assessmentId') || '').trim());
    } catch {
      setAssessmentId('');
    }
  }, []);

  // Firebase Auth 준비된 후에만 API 호출
  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoading(false);
      return;
    }
    if (!assessmentId) {
      setLoading(false);
      setError('검사코드 식별 정보가 없습니다.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getProgress(assessmentId), listAssessments().catch(() => ({ assessments: [] }))])
      .then(([progress, listData]) => {
        if (cancelled) return;
        setAccessCode(progress.accessCode || '');
        setByClient(progress.byClient || []);
        const found = (listData.assessments || []).find((a: { id: string }) => a.id === assessmentId);
        if (found) setTitle(found.title);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '진행 현황 조회 실패');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, assessmentId]);

  if (!assessmentId) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">잘못된 경로입니다.</p>
        <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          검사코드 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
          ← 목록
        </Link>
      </div>

      {authLoading || loading ? (
        <p className="text-slate-400">불러오는 중…</p>
      ) : !user ? (
        <div className="rounded-lg bg-amber-900/20 border border-amber-600/50 p-4 text-amber-200">
          <p>로그인이 필요합니다.</p>
          <p className="text-sm mt-2">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
          <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
            검사코드 목록으로
          </Link>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
          {error}
          <div className="mt-2">
            <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300 text-sm">
              검사코드 목록으로
            </Link>
          </div>
        </div>
      ) : (
        <ProgressDashboard assessmentId={assessmentId} accessCode={accessCode} byClient={byClient} assessmentTitle={title} />
      )}
    </div>
  );
}

