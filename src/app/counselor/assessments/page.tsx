'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AssessmentList from '@/components/counselor/AssessmentList';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  listAssessments,
  type CounselorAssessment,
  type CreatedAssessmentBannerInfo,
} from '@/lib/assessmentApi';

export default function AssessmentListPage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [assessments, setAssessments] = useState<CounselorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState<CreatedAssessmentBannerInfo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const createdId = params.get('created');
      if (createdId) {
        const raw = sessionStorage.getItem('wizcoco_created_assessment');
        if (raw) {
          const o = JSON.parse(raw) as { assessmentId?: string; accessCode?: string; joinPin?: string };
          if (o.assessmentId === createdId && o.accessCode) {
            setCreatedInfo({ accessCode: o.accessCode, joinPin: o.joinPin });
            sessionStorage.removeItem('wizcoco_created_assessment');
            return;
          }
        }
      }
      const legacyCode = params.get('code');
      if (legacyCode) {
        setCreatedInfo({ accessCode: legacyCode });
      }
    } catch {
      setCreatedInfo(null);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoading(false);
      return;
    }
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
  }, [authLoading, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">검사코드 목록</h1>
        <Link
          href="/counselor/assessments/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
        >
          새 검사코드 만들기
        </Link>
      </div>
      {authLoading || loading ? (
        <p className="text-slate-400">불러오는 중…</p>
      ) : !user ? (
        <div className="rounded-lg bg-amber-900/20 border border-amber-600/50 p-4 text-amber-200">
          <p>로그인이 필요합니다.</p>
          <p className="text-sm mt-2">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
          {error}
          <p className="text-sm mt-2">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
        </div>
      ) : (
        <AssessmentList assessments={assessments} createdInfo={createdInfo} />
      )}
    </div>
  );
}
