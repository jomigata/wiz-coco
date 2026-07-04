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

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return;

    if (!uid) {
      setApplicationStatus(null);
      setAccessLoading(false);
      return;
    }

    setAccessLoading(true);
    void getUserCounselorApplication(uid)
      .then((application) => {
        if (!cancelled) setApplicationStatus(application?.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setApplicationStatus(null);
      })
      .finally(() => {
        if (!cancelled) setAccessLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, uid]);

  const loading = authLoading || (!!uid && accessLoading);
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
    isCounselorRole: isCounselor(role),
  };
}
