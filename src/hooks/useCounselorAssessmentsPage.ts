'use client';

import { useEffect, useState } from 'react';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { isLoginRequiredError } from '@/lib/authRedirect';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import {
  listAssessments,
  readCachedAssessmentsList,
  type CounselorAssessment,
} from '@/lib/assessmentApi';

export function useCounselorAssessmentsPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [assessments, setAssessments] = useState<CounselorAssessment[]>(
    () => readCachedAssessmentsList() ?? [],
  );
  const [loading, setLoading] = useState(() => !readCachedAssessmentsList()?.length);
  const [error, setError] = useState('');

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

  return {
    assessments,
    loading,
    error,
    authPending,
    showLoginRequired,
    hasCache,
    showInitialLoader,
    showAuthGate,
    revalidating: hasCache && (authPending || loading),
  };
}
