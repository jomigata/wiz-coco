'use client';

import { createContext, useContext } from 'react';

export type EgoOkReportTabNav = {
  selectTab: (id: string) => void;
};

export const EgoOkReportTabNavContext = createContext<EgoOkReportTabNav | null>(null);

export function useEgoOkReportTabNav(): EgoOkReportTabNav | null {
  return useContext(EgoOkReportTabNavContext);
}

/** cover(종합 요약) 제외 — 탭 순서와 동일한 일련번호 */
export const EGO_OK_REPORT_TAB_IDS = [
  'cover',
  'validity',
  'ktaa',
  'egogram',
  'plus243',
  'self-help',
  'ok-life',
  'inner',
  'polarity',
] as const;

export type EgoOkReportTabId = (typeof EGO_OK_REPORT_TAB_IDS)[number];

export function egoOkReportSectionNumber(tabId: string): number | undefined {
  if (tabId === 'cover') return undefined;
  const index = EGO_OK_REPORT_TAB_IDS.indexOf(tabId as EgoOkReportTabId);
  if (index <= 0) return undefined;
  return index;
}

export function formatEgoOkSectionTitle(sectionNo: number | undefined, title: string): string {
  if (sectionNo == null) return title;
  return `${sectionNo}. ${title}`;
}
