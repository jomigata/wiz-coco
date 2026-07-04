import type { CounselorApplicationStatus } from '@/lib/firestore/counselorApplicationsStore';
import { isAdmin, isCounselor } from '@/utils/roleUtils';

export function isPendingCounselorApplication(
  status: CounselorApplicationStatus | null | undefined,
): boolean {
  return status === 'pending' || status === 'under_review';
}

export function hasCounselorApplicationRecord(
  status: CounselorApplicationStatus | null | undefined,
): boolean {
  return status != null;
}

/** 승인된 상담사·관리자만 전문가 메뉴·파트너·Discover 구매 경로 이용 가능 */
export function canAccessCounselorProfessionalFeatures(
  role: unknown,
  applicationStatus: CounselorApplicationStatus | null | undefined,
): boolean {
  if (!isCounselor(role)) return false;
  if (isAdmin(role)) return true;
  if (isPendingCounselorApplication(applicationStatus)) return false;
  return true;
}

export function canShowCounselorApplyIcon(
  role: unknown,
  applicationStatus: CounselorApplicationStatus | null | undefined,
): boolean {
  if (isCounselor(role) && !isPendingCounselorApplication(applicationStatus)) return false;
  if (isPendingCounselorApplication(applicationStatus)) return false;
  return applicationStatus == null || applicationStatus === 'rejected';
}

export function counselorApplicationStatusLabel(
  status: CounselorApplicationStatus | null | undefined,
): string {
  if (status === 'pending' || status === 'under_review') return '승인신청중';
  if (status === 'rejected') return '반려됨';
  if (status === 'approved') return '승인됨';
  return '';
}
