'use client';

import React, { useEffect, useState } from 'react';
import AuthLink from '@/components/auth/AuthLink';
import ProgressDashboard from '@/components/counselor/ProgressDashboard';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { getProgress, listAssessments } from '@/lib/assessmentApi';
import type { ProgressByClient } from '@/lib/assessmentApi';

export default function ProgressDashboardPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [assessmentId, setAssessmentId] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [joinPin, setJoinPin] = useState('');
  const [byClient, setByClient] = useState<ProgressByClient[]>([]);
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

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoading(false);
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
        if (found) {
          setTitle(found.title);
          setJoinPin(found.joinPin || '');
        }
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
  }, [authPending, user, showLoginRequired, assessmentId]);

  if (!assessmentId) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">잘못된 경로입니다.</p>
        <AuthLink href="/counselor/assessments" className="text-blue-400 hover:text-blue-300">
          검사코드 목록으로
        </AuthLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressBackLink />

      {authPending || loading ? (
        <AuthLoadingState className="py-8" />
      ) : showLoginRequired ? (
        <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
      ) : error ? (
        <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
          {error}
          <div className="mt-2">
            <AuthLink href="/counselor/assessments" className="text-blue-400 hover:text-blue-300 text-sm">
              검사코드 목록으로
            </AuthLink>
          </div>
        </div>
      ) : (
        <ProgressDashboard
          assessmentId={assessmentId}
          accessCode={accessCode}
          joinPin={joinPin}
          byClient={byClient}
          assessmentTitle={title}
        />
      )}
    </div>
  );
}

function ProgressBackLink() {
  return (
    <div className="flex items-center gap-4">
      <AuthLink href="/counselor/assessments" className="text-slate-400 hover:text-white text-sm">
        ← 목록
      </AuthLink>
    </div>
  );
}
