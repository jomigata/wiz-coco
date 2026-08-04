'use client';

import React, { useState, useEffect } from 'react';
import AssessmentList from '@/components/counselor/AssessmentList';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { isLoginRequiredError } from '@/lib/authRedirect';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  listAssessments,
  readCachedAssessmentsList,
  type CounselorAssessment,
  type CreatedAssessmentBannerInfo,
} from '@/lib/assessmentApi';

export default function AssessmentListPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [assessments, setAssessments] = useState<CounselorAssessment[]>(
    () => readCachedAssessmentsList() ?? [],
  );
  const [loading, setLoading] = useState(() => !readCachedAssessmentsList()?.length);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState<CreatedAssessmentBannerInfo | null>(null);
  const [autoLivePollId, setAutoLivePollId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const createdId = params.get('created');
      if (createdId) {
        const raw = sessionStorage.getItem('wizcoco_created_assessment');
        if (raw) {
          const o = JSON.parse(raw) as {
            assessmentId?: string;
            accessCode?: string;
            cohortName?: string;
            title?: string;
          };
          if (o.assessmentId === createdId && o.accessCode) {
            setCreatedInfo({
              accessCode: o.accessCode,
              cohortName: o.cohortName,
              title: o.title,
            });
            setAutoLivePollId(createdId);
            sessionStorage.removeItem('wizcoco_created_assessment');
          }
        }
        const cached = readCachedAssessmentsList();
        if (cached?.length) {
          setAssessments(cached);
          setLoading(false);
        }
        return;
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
    if (authPending || !user) {
      if (showLoginRequired) setLoading(false);
      return;
    }
    let cancelled = false;
    const hasCache = assessments.length > 0;
    if (!hasCache) setLoading(true);
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
  }, [authPending, user, showLoginRequired]);

  useRedirectOnLoginRequiredError(error);

  const hasCache = assessments.length > 0;
  const showInitialLoader = !hasCache && (authPending || loading);
  const showAuthGate =
    !hasCache && (showLoginRequired || (error && isLoginRequiredError(error)));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showInitialLoader ? (
        <AuthLoadingState />
      ) : showAuthGate ? (
        <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />
      ) : error ? (
        <div className="rounded-xl bg-red-900/20 border border-red-600/30 p-5">
          <p className="text-red-200 font-medium">{error}</p>
          <p className="text-red-400/70 text-sm mt-0.5">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
        </div>
      ) : (
        <>
          {(authPending || loading) && assessments.length > 0 ? (
            <p className="mb-2 shrink-0 text-xs text-sky-300/80" role="status">
              저장된 목록을 표시 중… 최신 정보를 불러오고 있습니다.
            </p>
          ) : null}
          <AssessmentList
            assessments={assessments}
            createdInfo={createdInfo}
            autoLivePollId={autoLivePollId}
            onAssessmentsRefresh={setAssessments}
          />
        </>
      )}
    </div>
  );
}
