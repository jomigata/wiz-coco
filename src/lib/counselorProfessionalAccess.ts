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
  if (isAdmin(role)) return true;
  if (role === 'counselor') return true;
  // Firestore role 동기화 전에도 승인 신청서가 있으면 접근 허용
  if (applicationStatus === 'approved') return true;
  if (isPendingCounselorApplication(applicationStatus)) return false;
  return false;
}

/** 상담사 영역 접근 거부 시 이동할 경로 (승인 완료 계정은 신청 페이지로 보내지 않음) */
export function getCounselorAreaRedirectPath(
  role: unknown,
  applicationStatus: CounselorApplicationStatus | null | undefined,
): string {
  if (canAccessCounselorProfessionalFeatures(role, applicationStatus)) {
    return '/counselor/';
  }
  return '/counselor-application/';
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
