/** 신입생 목록(test-management)과 통일된 테이블 스타일 */

export const counselorListTableWrapperClass = 'overflow-x-auto';

export const counselorListHeaderRowClass = 'border-b border-white/20';

export const counselorListThClass = 'text-left text-gray-300 py-3 px-4 text-sm font-medium';

export const counselorListNoThClass =
  'w-10 text-left text-gray-300 py-3 px-4 text-sm font-medium tabular-nums';

/** thead 요소용 — tr에 counselorListHeaderRowClass 사용 */
export const counselorListTheadClass = '';

export const counselorListTdClass = 'py-3 px-4 text-left text-sm text-gray-300 align-top';

export const counselorListTdCompactClass = 'py-3 px-4 text-left text-sm text-gray-300 align-top';

export const counselorListBodyRowClass =
  'border-b border-white/10 hover:bg-white/5 transition-colors';

export const counselorListActionBtnClass =
  'inline-flex min-w-[3.75rem] items-center justify-center rounded px-2 py-1 text-xs font-medium transition-colors';

export const counselorListSortActiveClass = 'text-cyan-400';

export const counselorListSortIdleClass = 'text-slate-600';

/** 결과현황 — 0이면 성공/완료(녹색), 1 이상이면 실패/미완료(적색) */
export function counselorResultMetricClass(value: number): string {
  return value === 0 ? 'text-emerald-400' : 'text-red-400';
}

export function formatCounselorIssueDate(iso: string | undefined | null): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(iso);
  }
}
