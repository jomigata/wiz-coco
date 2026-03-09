'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProgressDashboard from '@/components/counselor/ProgressDashboard';
import { getProgress, listAssessments } from '@/lib/assessmentApi';

export default function ProgressDashboardPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [accessCode, setAccessCode] = useState('');
  const [byClient, setByClient] = useState<{ clientEmail: string; results: { resultId: string; testId: string; status: string; completedAt: string | null }[] }[]>([]);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('패키지 ID가 없습니다.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      getProgress(id),
      listAssessments().catch(() => ({ assessments: [] })),
    ])
      .then(([progress, listData]) => {
        if (cancelled) return;
        setAccessCode(progress.accessCode || '');
        setByClient(progress.byClient || []);
        const found = (listData.assessments || []).find((a: { id: string }) => a.id === id);
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
  }, [id]);

  if (!id) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">잘못된 경로입니다.</p>
        <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          패키지 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/counselor/assessments"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← 목록
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-400">불러오는 중…</p>
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
          {error}
          <div className="mt-2">
            <Link href="/counselor/assessments" className="text-blue-400 hover:text-blue-300 text-sm">
              패키지 목록으로
            </Link>
          </div>
        </div>
      ) : (
        <ProgressDashboard
          accessCode={accessCode}
          byClient={byClient}
          assessmentTitle={title}
        />
      )}
    </div>
  );
}
