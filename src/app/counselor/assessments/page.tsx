'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AssessmentList from '@/components/counselor/AssessmentList';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import { isLoginRequiredError } from '@/lib/authRedirect';
import { isCounselorRoleRequiredMessage, syncCounselorRoleViaApi } from '@/lib/counselorAuth';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { parseAssessmentListSearchFromUrl } from '@/lib/counselorAssessmentListSearch';
import {
  listAssessments,
  listAssessmentsPage,
  readPortalMoveBanner,
  clearCounselorAssessmentsListCache,
  type CounselorAssessment,
  type CreatedAssessmentBannerInfo,
  type PortalMoveBannerInfo,
} from '@/lib/assessmentApi';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';

function AssessmentListPageContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = parseAssessmentListSearchFromUrl(searchParams.get('search'));
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const { refreshAuthRole } = useFirebaseAuth();
  const counselorUid = user?.uid;
  const adminUser = isAdmin(user?.role ?? getAppRoleSync());
  const [assessments, setAssessments] = useState<CounselorAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState<CreatedAssessmentBannerInfo | null>(null);
  const [moveInfo, setMoveInfo] = useState<PortalMoveBannerInfo | null>(null);
  const [autoLivePollId, setAutoLivePollId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('moved') === '1') {
        const moved = readPortalMoveBanner();
        if (moved) setMoveInfo(moved);
        return;
      }
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
        return;
      }
      const legacyCode = params.get('code');
      if (legacyCode) {
        setCreatedInfo({ accessCode: legacyCode });
      }
    } catch {
      setCreatedInfo(null);
    }
  }, [counselorUid]);

  useEffect(() => {
    if (authPending || !user) {
      if (showLoginRequired) setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');

    const searchQ = initialSearchQuery.trim() || undefined;

    listAssessmentsPage({ limit: 50, q: searchQ, includeStats: true, ownOnly: adminUser })
      .then(async (firstPage) => {
        if (cancelled) return;
        const firstItems = firstPage.assessments || [];
        setAssessments(firstItems);
        if (!firstItems.length) {
          clearCounselorAssessmentsListCache(counselorUid);
        }
        setLoading(false);
        if (!firstPage.nextCursor) return;
        setLoadingMore(true);
        const all = await listAssessments({ q: searchQ, includeStats: true, ownOnly: adminUser });
        if (!cancelled) setAssessments(all.assessments || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '목록 조회 실패');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authPending, user, showLoginRequired, initialSearchQuery, adminUser]);

  useRedirectOnLoginRequiredError(error);

  const hasCache = assessments.length > 0;
  const showInitialLoader = authPending || (loading && !hasCache);
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
          <p className="text-red-200 font-medium">
            {isCounselorRoleRequiredMessage(error)
              ? '상담사 권한 동기화가 필요합니다. 아래 버튼으로 다시 시도해 주세요.'
              : error}
          </p>
          {isCounselorRoleRequiredMessage(error) ? (
            <button
              type="button"
              onClick={() => {
                void syncCounselorRoleViaApi()
                  .then(() => refreshAuthRole())
                  .finally(() => window.location.reload());
              }}
              className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              권한 동기화 후 새로고침
            </button>
          ) : (
            <p className="text-red-400/70 text-sm mt-0.5">Firebase에 로그인한 상태에서 다시 시도해 주세요.</p>
          )}
        </div>
      ) : (
        <>
          {(authPending || loading || loadingMore) && assessments.length > 0 ? (
            <LoadingMessage
              layout="inline"
              className="mb-2 shrink-0"
              message={
                loadingMore
                  ? '목록을 추가로 로딩중…'
                  : '저장된 목록을 표시 중… 최신 정보를 불러오고 있습니다.'
              }
              textClassName="text-xs text-sky-300/80"
            />
          ) : null}
          <AssessmentList
            key={initialSearchQuery}
            assessments={assessments}
            createdInfo={createdInfo}
            moveInfo={moveInfo}
            autoLivePollId={autoLivePollId}
            onAssessmentsRefresh={setAssessments}
            initialSearchQuery={initialSearchQuery}
          />
        </>
      )}
    </div>
  );
}

export default function AssessmentListPage() {
  return (
    <Suspense fallback={<AuthLoadingState />}>
      <AssessmentListPageContent />
    </Suspense>
  );
}
