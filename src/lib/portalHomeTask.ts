import type { TestResultItem } from '@/lib/assessmentApi';
import type { PortalCareAssignmentItem } from '@/types/careAssignment';

export type PortalAssessmentSlice = {
  assessmentId: string;
  accessCode: string;
  title?: string;
  testList?: { testId: string; name?: string }[];
};

export type PortalHomeTestItem = {
  assessmentId: string;
  accessCode: string;
  testId: string;
  testName: string;
  completed: boolean;
  mode: 'continue' | 'start' | 'done';
  resultId?: string;
};

export type PortalHomeTask =
  | {
      kind: 'test';
      assessmentId: string;
      accessCode: string;
      assessmentTitle: string;
      testId: string;
      testName: string;
      mode: 'continue' | 'start';
      resultId?: string;
    }
  | {
      kind: 'care';
      assignmentId: string;
      title: string;
      programLabel: string;
    }
  | { kind: 'all_done'; completedTests: number; totalTests: number }
  | { kind: 'empty' };

export type PortalHomeOverview = {
  totalTests: number;
  pendingTests: number;
  testItems: PortalHomeTestItem[];
  careTask: Extract<PortalHomeTask, { kind: 'care' }> | null;
};

function testResultsFor(
  accessCode: string,
  resultsByCode: Record<string, TestResultItem[]>,
  normalizeCode: (code: string) => string,
): TestResultItem[] {
  return resultsByCode[normalizeCode(accessCode)] || [];
}

function isTestCompleted(testId: string, results: TestResultItem[]): boolean {
  return results.some((r) => r.status === 'completed' && String(r.testId) === String(testId));
}

function findInProgressResult(testId: string, results: TestResultItem[]): TestResultItem | null {
  return (
    results.find(
      (r) => String(r.testId) === String(testId) && r.status !== 'completed' && r.resultId,
    ) || null
  );
}

export function buildPortalHomeOverview(params: {
  assessments: PortalAssessmentSlice[];
  resultsByCode: Record<string, TestResultItem[]>;
  careItems: PortalCareAssignmentItem[];
  normalizeCode: (code: string) => string;
}): PortalHomeOverview {
  const { assessments, resultsByCode, careItems, normalizeCode } = params;

  const testItems: PortalHomeTestItem[] = [];
  let totalTests = 0;
  let pendingTests = 0;

  for (const assessment of assessments) {
    const results = testResultsFor(assessment.accessCode, resultsByCode, normalizeCode);
    for (const test of assessment.testList || []) {
      totalTests += 1;
      const testId = String(test.testId);
      const completed = isTestCompleted(testId, results);
      if (!completed) pendingTests += 1;
      const inProgress = completed ? null : findInProgressResult(testId, results);
      testItems.push({
        assessmentId: assessment.assessmentId,
        accessCode: assessment.accessCode,
        testId,
        testName: test.name || testId,
        completed,
        mode: completed ? 'done' : inProgress ? 'continue' : 'start',
        resultId: inProgress?.resultId,
      });
    }
  }

  const activeCare = careItems.find((item) => item.progress?.status !== 'completed');
  const careTask = activeCare
    ? {
        kind: 'care' as const,
        assignmentId: activeCare.assignmentId,
        title: activeCare.title || '추가 과제',
        programLabel: activeCare.programId || '',
      }
    : null;

  return { totalTests, pendingTests, testItems, careTask };
}

export function pickPortalHomeTask(params: {
  assessments: PortalAssessmentSlice[];
  resultsByCode: Record<string, TestResultItem[]>;
  careItems: PortalCareAssignmentItem[];
  normalizeCode: (code: string) => string;
}): PortalHomeTask {
  const overview = buildPortalHomeOverview(params);

  const nextTest = overview.testItems.find((item) => !item.completed);
  if (nextTest) {
    return {
      kind: 'test',
      assessmentId: nextTest.assessmentId,
      accessCode: nextTest.accessCode,
      assessmentTitle: '검사',
      testId: nextTest.testId,
      testName: nextTest.testName,
      mode: nextTest.mode === 'continue' ? 'continue' : 'start',
      resultId: nextTest.resultId,
    };
  }

  if (overview.careTask) {
    return overview.careTask;
  }

  if (overview.totalTests > 0 && overview.pendingTests === 0) {
    return {
      kind: 'all_done',
      completedTests: overview.totalTests,
      totalTests: overview.totalTests,
    };
  }

  return { kind: 'empty' };
}

export function portalHomeTestButtonLabel(item: PortalHomeTestItem, index: number): string {
  const prefix = `${index + 1}. `;
  if (item.completed) return `${prefix}${item.testName} 완료`;
  if (item.mode === 'continue') return `${prefix}${item.testName} 이어하기`;
  return `${prefix}${item.testName} 시작하기`;
}

export function portalHomeTaskButtonLabel(task: PortalHomeTask): string {
  if (task.kind === 'test') {
    return task.mode === 'continue' ? `${task.testName} 이어하기` : `${task.testName} 시작하기`;
  }
  if (task.kind === 'care') {
    return `${task.title} 하기`;
  }
  if (task.kind === 'all_done') {
    return '기록 보기';
  }
  return '기록 보기';
}

export function portalHomeTaskSubtitle(task: PortalHomeTask): string {
  if (task.kind === 'test') {
    return task.mode === 'continue'
      ? '중간까지 진행한 검사를 이어서 마무리해 주세요.'
      : '오늘 할 검사입니다. 편한 시간에 진행해 주세요.';
  }
  if (task.kind === 'care') {
    return '담당 상담사가 남긴 과제입니다.';
  }
  if (task.kind === 'all_done') {
    return '배정된 검사를 모두 마쳤습니다. 상담사가 결과를 확인합니다.';
  }
  return '배정된 검사가 없습니다. 담당 상담사에게 문의해 주세요.';
}

export function portalHomeTestsSubtitle(pendingTests: number, totalTests: number): string {
  if (totalTests <= 0) {
    return '배정된 검사가 없습니다. 담당 상담사에게 문의해 주세요.';
  }
  return `오늘할 검사 (${pendingTests}/${totalTests})입니다.`;
}
