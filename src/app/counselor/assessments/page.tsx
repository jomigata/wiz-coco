'use client';

import React, { useState, useEffect } from 'react';
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
          const o = JSON.parse(raw) as { assessmentId?: string; accessCode?: string };
          if (o.assessmentId === createdId && o.accessCode) {
            setCreatedInfo({ accessCode: o.accessCode });
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
    <div className="flex min-h-0 flex-1 flex-col">
      {authLoading || loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm">불러오는 중…</p>
          </div>
        </div>
      ) : !user ? (
        <div className="rounded-xl bg-amber-900/20 border border-amber-600/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-amber-200 font-medium">로그인이 필요합니다</p>
              <p className="text-amber-400/70 text-sm mt-0.5">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-900/20 border border-red-600/30 p-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-200 font-medium">{error}</p>
              <p className="text-red-400/70 text-sm mt-0.5">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
            </div>
          </div>
        </div>
      ) : (
        <AssessmentList assessments={assessments} createdInfo={createdInfo} />
      )}
    </div>
  );
}
