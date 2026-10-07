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
/** 학지사 결과지(첨부) 흐름 + WizCoCo 해석 탭 */
export const EGO_OK_REPORT_TAB_IDS = [
  'cover',
  'basic',
  'scale-90',
  'validity',
  'ktaa',
  'trait-overview',
  'egogram',
  'plus243',
  'ok-life',
  'inner',
  'polarity',
  'self-help',
  'career',
  'marriage',
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
