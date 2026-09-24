/** 상담사 목록 — 뷰포트 높이에 맞춘 페이지당 행 수 (스크롤 없이) */

export const COUNSELOR_LIST_PAGE_SIZE_AUTO = 'auto' as const;

const DEFAULT_ROW_HEIGHT_PX = 44;
const MIN_AUTO_PAGE_SIZE = 5;
const MAX_AUTO_PAGE_SIZE = 200;

export function measureCounselorListAutoPageSize(scrollEl: HTMLElement | null): number {
  if (!scrollEl) return 10;
  const available = scrollEl.clientHeight;
  if (available <= 8) return 10;

  const thead = scrollEl.querySelector('thead');
  const theadH = thead?.getBoundingClientRect().height ?? 0;
  const mainRow = scrollEl.querySelector(
    'tbody tr:not([data-counselor-list-expand-row])',
  ) as HTMLElement | null;
  const rowH =
    mainRow && mainRow.getBoundingClientRect().height > 0
      ? mainRow.getBoundingClientRect().height
      : DEFAULT_ROW_HEIGHT_PX;

  const bodySpace = Math.max(0, available - theadH);
  const count = Math.floor(bodySpace / rowH);
  if (!Number.isFinite(count) || count < 1) return MIN_AUTO_PAGE_SIZE;
  return Math.max(MIN_AUTO_PAGE_SIZE, Math.min(MAX_AUTO_PAGE_SIZE, count));
}

export function isCounselorListPageSizeAuto(value: string): value is typeof COUNSELOR_LIST_PAGE_SIZE_AUTO {
  return value === COUNSELOR_LIST_PAGE_SIZE_AUTO;
}
