import { getCounselorListScrollViewport } from '@/lib/counselorListAutoPageSize';

function escapePortalId(portalId: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(portalId);
  }
  return portalId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function resolveCounselorListMainRow(
  scrollEl: HTMLElement,
  portalId: string,
): HTMLElement | null {
  const esc = escapePortalId(portalId);
  return (
    scrollEl.querySelector<HTMLElement>(`#client-row-${esc}`) ??
    scrollEl.querySelector<HTMLElement>(`#dispatch-row-${esc}`) ??
    scrollEl.querySelector<HTMLElement>(
      `:scope > table > tbody > tr[data-portal-id="${esc}"]:not([data-counselor-list-expand-row])`,
    )
  );
}

export function resolveCounselorListExpandRow(mainRow: HTMLElement): HTMLElement | null {
  const next = mainRow.nextElementSibling;
  if (next instanceof HTMLElement && next.hasAttribute('data-counselor-list-expand-row')) {
    return next;
  }
  return null;
}

/**
 * 펼침 시: 세부가 아래에 잘리면 세부 하단을 목록 viewport 하단에 맞춤.
 * 그 후 세부 상단·본문 행이 함께 보이지 않으면 본문 행을 viewport 최상단에 맞춤.
 */
export function scrollCounselorListExpandIntoView(
  scrollEl: HTMLElement,
  mainRow: HTMLElement,
  expandRow: HTMLElement | null,
): void {
  const readViewport = () => getCounselorListScrollViewport(scrollEl);

  let { top: viewportTop, bottom: viewportBottom } = readViewport();
  let mainRect = mainRow.getBoundingClientRect();
  let expandRect = expandRow?.getBoundingClientRect() ?? null;

  if (expandRect && expandRect.bottom > viewportBottom + 0.5) {
    scrollEl.scrollTop += expandRect.bottom - viewportBottom;
    ({ top: viewportTop, bottom: viewportBottom } = readViewport());
    mainRect = mainRow.getBoundingClientRect();
    expandRect = expandRow?.getBoundingClientRect() ?? null;
  }

  if (expandRect) {
    const expandTopVisible = expandRect.top >= viewportTop - 0.5;
    const mainTopVisible = mainRect.top >= viewportTop - 0.5;
    if (!expandTopVisible || !mainTopVisible) {
      scrollEl.scrollTop += mainRect.top - viewportTop;
    }
    return;
  }

  if (mainRect.top < viewportTop - 0.5) {
    scrollEl.scrollTop += mainRect.top - viewportTop;
  } else if (mainRect.bottom > viewportBottom + 0.5) {
    scrollEl.scrollTop += mainRect.bottom - viewportBottom;
  }
}
