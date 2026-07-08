/** 상담사 내담자 상세 — static export 호환 (query param) */
export function counselorClientDetailHref(portalId: string): string {
  return `/counselor/clients/detail?portalId=${encodeURIComponent(portalId)}`;
}
