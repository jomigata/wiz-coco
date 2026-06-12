/** 상담사 전환 결과(승인/거부) 확인 여부 — localStorage */

export function counselorResultSeenKey(applicationId: string, reviewedAt: string): string {
  return `wizcoco:counselor-result-seen:${applicationId}:${reviewedAt}`;
}

export function isCounselorResultSeen(applicationId: string, reviewedAt?: string): boolean {
  if (typeof window === 'undefined' || !applicationId || !reviewedAt) return false;
  return localStorage.getItem(counselorResultSeenKey(applicationId, reviewedAt)) === '1';
}

export function markCounselorResultSeen(applicationId: string, reviewedAt: string): void {
  if (typeof window === 'undefined' || !applicationId || !reviewedAt) return;
  localStorage.setItem(counselorResultSeenKey(applicationId, reviewedAt), '1');
  window.dispatchEvent(new Event('wizcoco:counselor-result-seen'));
}

export function shouldNotifyCounselorResult(
  status: string | null | undefined,
  reviewedAt?: string,
  applicationId?: string,
): boolean {
  if (!applicationId || !reviewedAt) return false;
  if (status !== 'approved' && status !== 'rejected') return false;
  return !isCounselorResultSeen(applicationId, reviewedAt);
}
