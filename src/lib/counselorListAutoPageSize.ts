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

/** 펼침 시: 펼친 본문+세부(세부가 잘려도 유지)까지 포함하고, 그 아래 완전히 보이는 행만 현재 페이지에 둠 */
export function measureFitCountWithExpand(
  scrollEl: HTMLElement,
  expandedId: string | null,
): number {
  const containerRect = scrollEl.getBoundingClientRect();
  const maxBottom = containerRect.bottom - 1;

  const mainRows = Array.from(
    scrollEl.querySelectorAll<HTMLElement>('tbody tr:not([data-counselor-list-expand-row])'),
  );
  if (mainRows.length === 0) return 1;

  let expandedIndex = -1;
  for (let i = 0; i < mainRows.length; i++) {
    if (rowMatchesExpandedId(mainRows[i], expandedId)) {
      expandedIndex = i;
      break;
    }
  }

  if (expandedIndex < 0 || !expandedId) {
    let visible = 0;
    for (const row of mainRows) {
      const rowRect = row.getBoundingClientRect();
      if (rowRect.top >= containerRect.bottom) break;
      if (rowRect.bottom <= maxBottom + 0.5) visible += 1;
      else break;
    }
    return Math.max(1, visible);
  }

  // 펼친 본문 행까지는 항상 현재 페이지 (세부 행이 viewport 밖으로 잘려도 유지)
  let fitCount = expandedIndex + 1;

  for (let i = expandedIndex + 1; i < mainRows.length; i++) {
    const rowRect = mainRows[i].getBoundingClientRect();
    if (rowRect.top >= maxBottom) break;
    if (rowRect.bottom <= maxBottom + 0.5) {
      fitCount += 1;
    } else {
      break;
    }
  }

  return Math.max(expandedIndex + 1, fitCount);
}

/** @deprecated use measureFitCountWithExpand */
export function measureVisibleMainRowsInScroll(
  scrollEl: HTMLElement,
  expandedId: string | null,
): number {
  return measureFitCountWithExpand(scrollEl, expandedId);
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
