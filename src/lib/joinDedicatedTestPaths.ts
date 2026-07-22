/**
 * 검사코드(포털)에서 선택한 testId → 전용 검사 페이지 경로
 * genericJoinQuestions(/join/test) 대신 실제 /tests/* 플로우로 연결
 */
export const JOIN_DEDICATED_TEST_PATHS: Record<string, string> = {
  'ego-ok-pro': '/tests/ego-ok-pro',
  mbti_pro: '/tests/mbti_pro',
};

export function resolveDedicatedJoinTestPath(testId: string): string | null {
  const id = (testId || '').trim();
  if (!id) return null;
  return JOIN_DEDICATED_TEST_PATHS[id] ?? null;
}

export function buildDedicatedJoinTestUrl(
  dedicatedPath: string,
  params: { accessCode: string; testId: string; from?: string; resultId?: string },
): string {
  const search = new URLSearchParams({
    accessCode: params.accessCode,
    testId: params.testId,
  });
  if (params.from) search.set('from', params.from);
  if (params.resultId) search.set('resultId', params.resultId);
  return `${dedicatedPath}?${search.toString()}`;
}
