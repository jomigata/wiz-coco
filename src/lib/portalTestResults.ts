import { TestResultItem } from '@/lib/assessmentApi';

export function resultEffectiveTimestamp(r: TestResultItem): number {
  const iso = r.updatedAt || r.completedAt;
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function pickFinalResultId(results: TestResultItem[]): string | null {
  if (results.length < 2) return null;
  let finalId = results[0]?.resultId ?? null;
  let best = resultEffectiveTimestamp(results[0]);
  for (const r of results.slice(1)) {
    const t = resultEffectiveTimestamp(r);
    if (t >= best) {
      best = t;
      finalId = r.resultId;
    }
  }
  return finalId;
}

export function resultSubmittedLabel(r: TestResultItem): string | null {
  return r.submittedAt || r.completedAt;
}

function submissionTimestamp(r: TestResultItem): number {
  const iso = resultSubmittedLabel(r);
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 제출일시 기준 회차 — 생성 후 submittedAt 불변이므로 고정 */
export function assignRoundNumbers(results: TestResultItem[]): Map<string, number> {
  const sorted = [...results].sort((a, b) => submissionTimestamp(a) - submissionTimestamp(b));
  const map = new Map<string, number>();
  sorted.forEach((r, i) => map.set(r.resultId, i + 1));
  return map;
}

/** 최종 회차를 최상단, 나머지는 제출일시 내림차순 */
export function sortCompletedResultsForDisplay(
  results: TestResultItem[],
  finalResultId: string | null,
): TestResultItem[] {
  return [...results].sort((a, b) => {
    if (finalResultId) {
      if (a.resultId === finalResultId && b.resultId !== finalResultId) return -1;
      if (b.resultId === finalResultId && a.resultId !== finalResultId) return 1;
    }
    return submissionTimestamp(b) - submissionTimestamp(a);
  });
}

export function formatCompletedAt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function makeTestExpandKey(assessmentId: string, testId: string): string {
  return `${assessmentId}:${testId}`;
}

export function findFirstCompletedExpandKey(
  sections: Array<{
    assessmentId: string;
    accessCode: string;
    testList: { testId: string }[];
  }>,
  resultsByCode: Record<string, TestResultItem[]>,
  normalizeCode: (code: string) => string,
): string | null {
  for (const section of sections) {
    const code = normalizeCode(section.accessCode);
    const results = resultsByCode[code] || [];
    for (const t of section.testList || []) {
      const hasCompleted = results.some(
        (r) => r.status === 'completed' && String(r.testId) === String(t.testId),
      );
      if (hasCompleted) {
        return makeTestExpandKey(section.assessmentId, String(t.testId));
      }
    }
  }
  return null;
}
