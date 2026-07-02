"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { buildLoginRedirectUrl } from '@/lib/authRedirect';
import {
  isAuthLoginInProgress,
  pushWithAuthSession,
  replaceWithAuthSession,
  tryRestoreAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';
import { shouldShowCounselorMenu, shouldShowAdminMenu, shouldShowOrgMenu } from '@/utils/roleUtils';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('counselor' | 'admin' | 'org_admin')[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/',
}: RoleGuardProps) {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (authPending) return;

    if (showLoginRequired || !user) {
      setIsAuthorized(false);
      setIsChecking(false);

      if (isAuthLoginInProgress()) return;

      tryRestoreAuthenticatedTabSession();
      const timer = window.setTimeout(() => {
        if (isAuthLoginInProgress()) return;
        replaceWithAuthSession(router, buildLoginRedirectUrl());
      }, 400);

      return () => window.clearTimeout(timer);
    }

    const role = user.role || 'user';
    let hasAccess = false;

    if (allowedRoles.includes('admin') && shouldShowAdminMenu(role)) {
      hasAccess = true;
    } else if (allowedRoles.includes('counselor') && shouldShowCounselorMenu(role)) {
      hasAccess = true;
    } else if (allowedRoles.includes('org_admin') && shouldShowOrgMenu(role) && role === 'org_admin') {
      hasAccess = true;
    } else if (allowedRoles.includes('org_admin') && shouldShowAdminMenu(role)) {
      hasAccess = true;
    }

    setIsAuthorized(hasAccess);
    setIsChecking(false);

    if (!hasAccess) {
      pushWithAuthSession(router, redirectTo);
    }
  }, [user, authPending, showLoginRequired, allowedRoles, router, redirectTo]);

  if (authPending || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-blue-200">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
          <h2 className="text-2xl font-bold text-red-400 mb-4">접근 권한이 없습니다</h2>
          <p className="text-red-200 mb-6">이 페이지에 접근할 권한이 없습니다.</p>
          <button
            onClick={() => pushWithAuthSession(router, '/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
