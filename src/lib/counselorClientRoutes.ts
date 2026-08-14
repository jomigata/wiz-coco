/** 상담진행 현황 — 내담자 행 클릭 (static export 호환) */
export function counselorClientProgressHref(assessmentId: string, portalId: string): string {
  const params = new URLSearchParams({
    assessmentId,
    portalId,
    from: 'clients',
  });
  return `/counselor/assessments/progress?${params.toString()}`;
}

/** @deprecated 내담자 목록에서는 counselorClientProgressHref 사용 */
export function counselorClientDetailHref(portalId: string): string {
  return `/counselor/clients/detail?portalId=${encodeURIComponent(portalId)}`;
}
