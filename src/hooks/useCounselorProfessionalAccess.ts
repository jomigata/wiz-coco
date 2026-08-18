'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  subscribeUserCounselorApplication,
  type CounselorApplicationStatus,
} from '@/lib/firestore/counselorApplicationsStore';
import {
  canAccessCounselorProfessionalFeatures,
  canShowCounselorApplyIcon,
  hasCounselorApplicationRecord,
  isPendingCounselorApplication,
} from '@/lib/counselorProfessionalAccess';
import { isCounselor } from '@/utils/roleUtils';

export function useCounselorProfessionalAccess() {
  const { user, loading: authLoading, refreshAuthRole } = useFirebaseAuth();
  const [applicationStatus, setApplicationStatus] = useState<CounselorApplicationStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const role = user?.role || 'user';
  const uid = user?.uid || '';
  const counselorRole = isCounselor(role);

  useEffect(() => {
    if (authLoading) return;

    if (!uid) {
      setApplicationStatus(null);
      setAccessLoading(false);
      return;
    }

    setAccessLoading(true);
    const unsubscribe = subscribeUserCounselorApplication(uid, (application) => {
      setApplicationStatus(application?.status ?? null);
      setAccessLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [authLoading, uid]);

  // 승인됐는데 role이 아직 user인 경우 — Firestore/API에서 role 재동기화
  useEffect(() => {
    if (!uid || authLoading) return;
    if (applicationStatus !== 'approved') return;
    if (counselorRole) return;
    void refreshAuthRole();
  }, [applicationStatus, counselorRole, uid, authLoading, refreshAuthRole]);

  const loading = authLoading || (!!uid && accessLoading && !counselorRole);
  const isAuthenticated = !!uid;
  const isApprovedCounselor = canAccessCounselorProfessionalFeatures(role, applicationStatus);
  const isPendingApplication = isPendingCounselorApplication(applicationStatus);
  const hasApplied = hasCounselorApplicationRecord(applicationStatus);
  const canShowApplyIcon = canShowCounselorApplyIcon(role, applicationStatus);
  const showPendingBadge = isAuthenticated && isPendingApplication && !isApprovedCounselor;

  return {
    loading,
    isAuthenticated,
    role,
    applicationStatus,
    isApprovedCounselor,
    isPendingApplication,
    hasApplied,
    canShowApplyIcon,
    showPendingBadge,
    isCounselorRole: counselorRole,
  };
}
