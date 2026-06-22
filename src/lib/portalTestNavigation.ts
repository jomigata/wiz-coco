/**
 * 나의코드(포털) 로그인 후 미완료 검사로 바로 이동
 */
import { listResults, TestResultItem } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { fetchPortalDashboard } from '@/lib/clientPortalApi';
import { persistJoinAssessmentSession } from '@/lib/joinAssessmentSession';

export type PortalAssessmentItem = {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  accessCode: string;
};

export function getJoinTestPath(accessCode: string, testId: string): string {
  return `/join/test?accessCode=${encodeURIComponent(accessCode)}&testId=${encodeURIComponent(testId)}`;
}

export function findFirstIncompleteTest(
  assessments: PortalAssessmentItem[],
  resultsByCode: Record<string, TestResultItem[]>,
): { accessCode: string; testId: string; assessment: PortalAssessmentItem } | null {
  for (const a of assessments) {
    const code = normalizeAccessCodeInput(a.accessCode);
    if (!code || !a.testList?.length) continue;
    const results = resultsByCode[code] || [];
    const doneIds = new Set(
      results.filter((r) => r.status === 'completed').map((r) => String(r.testId)),
    );
    for (const t of a.testList) {
      const tid = String(t.testId);
      if (!doneIds.has(tid)) {
        return { accessCode: code, testId: tid, assessment: a };
      }
    }
  }
  return null;
}

export async function loadPortalResultsByCode(
  assessments: PortalAssessmentItem[],
): Promise<Record<string, TestResultItem[]>> {
  const map: Record<string, TestResultItem[]> = {};
  await Promise.all(
    assessments.map(async (a) => {
      const code = normalizeAccessCodeInput(a.accessCode);
      if (!code) return;
      try {
        const data = await listResults(code);
        map[code] = data.results || [];
      } catch {
        map[code] = [];
      }
    }),
  );
  return map;
}

/** 미완료 검사가 있으면 검사 실시 URL, 없으면 /portal/ */
export async function resolvePortalContinuePath(portalToken: string): Promise<string> {
  const data = await fetchPortalDashboard(portalToken);
  const items = (data.assessments || []) as PortalAssessmentItem[];
  const resultsByCode = await loadPortalResultsByCode(items);
  const next = findFirstIncompleteTest(items, resultsByCode);
  if (!next) return '/portal/';

  persistJoinAssessmentSession(next.accessCode, {
    assessmentId: next.assessment.assessmentId,
    title: next.assessment.title,
    welcomeMessage: next.assessment.welcomeMessage,
    usageEndDate: next.assessment.usageEndDate || '',
    testList: next.assessment.testList,
  });
  return getJoinTestPath(next.accessCode, next.testId);
}
