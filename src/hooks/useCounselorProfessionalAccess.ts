'use client';

import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import {
  getUserCounselorApplication,
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
  const { user, loading: authLoading } = useFirebaseAuth();
  const [applicationStatus, setApplicationStatus] = useState<CounselorApplicationStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);

  const role = user?.role || 'user';
  const uid = user?.uid || '';
  const counselorRole = isCounselor(role);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return;

    if (!uid) {
      setApplicationStatus(null);
      setAccessLoading(false);
      return;
    }

    const applyApplication = (application: Awaited<ReturnType<typeof getUserCounselorApplication>>) => {
      if (!cancelled) setApplicationStatus(application?.status ?? null);
    };

    if (counselorRole) {
      setAccessLoading(false);
      void getUserCounselorApplication(uid)
        .then(applyApplication)
        .catch(() => {
          if (!cancelled) setApplicationStatus(null);
        });
      return () => {
        cancelled = true;
      };
    }

    setAccessLoading(true);
    void getUserCounselorApplication(uid)
      .then(applyApplication)
      .catch(() => {
        if (!cancelled) setApplicationStatus(null);
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, uid, counselorRole]);

  const loading = authLoading || (!!uid && accessLoading && !counselorRole);
  const isAuthenticated = !!uid;
  const isApprovedCounselor = canAccessCounselorProfessionalFeatures(role, applicationStatus);
  const isPendingApplication = isPendingCounselorApplication(applicationStatus);
  const hasApplied = hasCounselorApplicationRecord(applicationStatus);
  const canShowApplyIcon = canShowCounselorApplyIcon(role, applicationStatus);
  const showPartnerIcon = isApprovedCounselor;
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
    showPartnerIcon,
    showPendingBadge,
    isCounselorRole: counselorRole,
  };
}
