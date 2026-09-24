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

function rowMatchesExpandedId(row: HTMLElement, expandedId: string | null): boolean {
  if (!expandedId) return false;
  if (row.id === `client-row-${expandedId}`) return true;
  if (row.id === `dispatch-row-${expandedId}`) return true;
  if (row.dataset.portalId === expandedId) return true;
  return false;
}

/** 펼침 행 포함 — 스크롤 영역 안에 완전히 들어오는 본문 행 개수 */
export function measureVisibleMainRowsInScroll(
  scrollEl: HTMLElement,
  expandedId: string | null,
): number {
  const containerRect = scrollEl.getBoundingClientRect();
  const maxBottom = containerRect.bottom - 1;

  const mainRows = Array.from(
    scrollEl.querySelectorAll<HTMLElement>('tbody tr:not([data-counselor-list-expand-row])'),
  );

  let visible = 0;
  for (const row of mainRows) {
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top >= containerRect.bottom) break;

    let blockBottom = rowRect.bottom;
    const next = row.nextElementSibling;
    if (
      next instanceof HTMLElement &&
      next.matches('[data-counselor-list-expand-row]') &&
      rowMatchesExpandedId(row, expandedId)
    ) {
      blockBottom = next.getBoundingClientRect().bottom;
    }

    if (blockBottom <= maxBottom) {
      visible += 1;
    } else {
      break;
    }
  }

  return Math.max(1, visible);
}

export function computeExpandAwareTotalPages(
  totalItems: number,
  pageSize: number,
  expandPage: number | null,
  fitCount: number | null,
): number {
  if (totalItems <= 0) return 1;
  if (!expandPage || fitCount == null || fitCount >= pageSize) {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }
  const before = (expandPage - 1) * pageSize;
  const afterExpandPage = Math.max(0, totalItems - before - fitCount);
  return expandPage + Math.ceil(afterExpandPage / pageSize);
}

export function sliceExpandAwarePage<T>(
  items: T[],
  page: number,
  pageSize: number,
  expandPage: number | null,
  fitCount: number | null,
): { startIndex: number; paginatedItems: T[] } {
  if (items.length === 0) {
    return { startIndex: 0, paginatedItems: [] };
  }
  if (!expandPage || fitCount == null || fitCount >= pageSize) {
    const startIndex = (page - 1) * pageSize;
    return { startIndex, paginatedItems: items.slice(startIndex, startIndex + pageSize) };
  }

  if (page < expandPage) {
    const startIndex = (page - 1) * pageSize;
    return { startIndex, paginatedItems: items.slice(startIndex, startIndex + pageSize) };
  }

  if (page === expandPage) {
    const startIndex = (expandPage - 1) * pageSize;
    return { startIndex, paginatedItems: items.slice(startIndex, startIndex + fitCount) };
  }

  const startIndex =
    (expandPage - 1) * pageSize + fitCount + (page - expandPage - 1) * pageSize;
  return { startIndex, paginatedItems: items.slice(startIndex, startIndex + pageSize) };
}
