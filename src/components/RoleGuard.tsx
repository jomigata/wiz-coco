"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';
import {
  isAuthLoginInProgress,
  pushWithAuthSession,
  replaceWithAuthSession,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';
import { shouldShowAdminMenu, shouldShowOrgMenu } from '@/utils/roleUtils';
import { canAccessCounselorProfessionalFeatures } from '@/lib/counselorProfessionalAccess';
import { useCounselorProfessionalAccess } from '@/hooks/useCounselorProfessionalAccess';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('counselor' | 'admin' | 'org_admin')[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * 상담사 영역은 신청 페이지로 자동 리다이렉트하지 않음.
 * (role hydrate 레이스로 승인 상담사가 /counselor-application/ 에 떨어지는 근본 원인)
 */
export default function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/',
}: RoleGuardProps) {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const { roleHydrating } = useFirebaseAuth();
  const { loading: accessLoading, applicationStatus } = useCounselorProfessionalAccess();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const loginRedirectedRef = useRef(false);

  const needsCounselorAccess = allowedRoles.includes('counselor');
  const rolesKey = useMemo(() => allowedRoles.slice().sort().join(','), [allowedRoles]);
  const sessionSettling =
    Boolean(user && (roleHydrating || (needsCounselorAccess && accessLoading))) ||
    isAuthLoginInProgress();

  useEffect(() => {
    if (authPending || sessionSettling) {
      setIsChecking(true);
      return;
    }

    if (showLoginRequired || !user) {
      setIsAuthorized(false);
      setIsChecking(false);

      if (isAuthLoginInProgress()) return;
      if (loginRedirectedRef.current) return;

      tryRestoreAuthenticatedTabSession();
      const timer = window.setTimeout(() => {
        if (isAuthLoginInProgress()) return;
        if (loginRedirectedRef.current) return;
        loginRedirectedRef.current = true;
        replaceWithAuthSession(router, buildLoginRedirectUrl());
      }, 400);

      return () => window.clearTimeout(timer);
    }

    const role = user.role || 'user';
    let hasAccess = false;

    if (allowedRoles.includes('admin') && shouldShowAdminMenu(role)) {
      hasAccess = true;
    } else if (needsCounselorAccess) {
      hasAccess = canAccessCounselorProfessionalFeatures(role, applicationStatus);
    } else if (allowedRoles.includes('org_admin') && shouldShowOrgMenu(role) && role === 'org_admin') {
      hasAccess = true;
    } else if (allowedRoles.includes('org_admin') && shouldShowAdminMenu(role)) {
      hasAccess = true;
    }

    setIsAuthorized(hasAccess);
    setIsChecking(false);

    // 상담사 영역: 권한 없음이어도 신청 페이지로 강제 이동하지 않음 (허브 URL 유지)
    if (!hasAccess && !needsCounselorAccess && redirectTo && redirectTo !== '/') {
      pushWithAuthSession(router, redirectTo);
    }
  }, [
    user,
    authPending,
    showLoginRequired,
    rolesKey,
    router,
    redirectTo,
    accessLoading,
    applicationStatus,
    needsCounselorAccess,
    sessionSettling,
    roleHydrating,
    allowedRoles,
  ]);

  if (authPending || isChecking || sessionSettling) {
    return (
      <div className="min-h-screen bg-[#0f1628] flex items-center justify-center">
        <div className="text-center rounded-xl border border-white/10 bg-[#162b4a] p-8 shadow-sm">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-sky-300 border-t-transparent" />
          <p className="text-xl text-slate-200">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (isAuthLoginInProgress()) {
      return (
        <div className="min-h-screen bg-[#0f1628] flex items-center justify-center">
          <div className="text-center rounded-xl border border-white/10 bg-[#162b4a] p-8 shadow-sm">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-sky-300 border-t-transparent" />
            <p className="text-xl text-slate-200">로그인을 처리하는 중입니다...</p>
          </div>
        </div>
      );
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (needsCounselorAccess) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f1628] px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#162b4a] p-8 text-center shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-white">상담사 권한이 필요합니다</h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300">
              이 메뉴는 승인된 상담사 계정에서만 이용할 수 있습니다. 권한 확인이 끝나지 않았다면
              잠시 후 새로고침해 주세요.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                새로고침
              </button>
              <Link
                href="/counselor-application/"
                className="text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                상담사 신청 현황 보기
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1628]">
        <div className="rounded-xl border border-white/10 bg-[#162b4a] p-8 text-center shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-red-400">접근 권한이 없습니다</h2>
          <p className="mb-6 text-slate-300">이 페이지에 접근할 권한이 없습니다.</p>
          <button
            type="button"
            onClick={() => pushWithAuthSession(router, '/')}
            className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
