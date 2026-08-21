import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import type { DispatchTestResult } from '@/lib/clientPortalApi';

export type MiniCheckBand = 'high' | 'moderate' | 'low';

export type CounselorNextTestRecommendation = {
  testId: string;
  name: string;
  /** 상담사에게 보여 줄 한 줄 — ‘유료’ 대신 회기 중심 문구 */
  pitch: string;
  /** 짧은 근거 (3분 체크 결과 연결) */
  rationale: string;
};

const READY_FALLBACK_ORDER = ['mbti', 'inside-mbti', 'mbti_pro', 'ai-profiling'] as const;

function testName(testId: string): string {
  return counselorAssessmentTestOptions.find((t) => t.testId === testId)?.name || testId;
}

function bandFromTests(tests: DispatchTestResult[]): MiniCheckBand | null {
  const generic = tests.find((t) => t.testId === 'generic' && t.status === 'completed');
  if (!generic) return null;
  const band = (generic.miniCheckBand || '').trim();
  if (band === 'high' || band === 'moderate' || band === 'low') return band;
  return 'moderate';
}

function pickCandidateId(band: MiniCheckBand, assignedIds: Set<string>): string | null {
  const primary =
    band === 'high' ? 'mbti_pro' : band === 'moderate' ? 'inside-mbti' : 'mbti';
  if (!assignedIds.has(primary)) return primary;
  for (const id of READY_FALLBACK_ORDER) {
    if (!assignedIds.has(id)) return id;
  }
  return null;
}

/** 3분 체크(generic) 완료 후 — 다음 검사 1개만 추천 */
export function resolveCounselorNextTestRecommendation(
  tests: DispatchTestResult[],
): CounselorNextTestRecommendation | null {
  if (!tests.length) return null;

  const generic = tests.find((t) => t.testId === 'generic');
  if (!generic || generic.status !== 'completed') return null;

  const band = bandFromTests(tests) ?? 'moderate';
  const assignedIds = new Set(tests.map((t) => t.testId));
  const pendingOther = tests.some(
    (t) => t.testId !== 'generic' && t.status !== 'completed' && t.status !== 'not_started',
  );
  if (pendingOther) return null;

  const hasOpenFollowUp = tests.some(
    (t) => t.testId !== 'generic' && (t.status === 'not_started' || t.status === 'in_progress'),
  );
  if (hasOpenFollowUp) return null;

  const testId = pickCandidateId(band, assignedIds);
  if (!testId) return null;

  const name = testName(testId);
  const pitch = `이번 회기에 ${name}이 있으면 이야기가 분명해집니다.`;

  const rationale =
    band === 'high'
      ? '3분 체크에서 스트레스·피로 신호가 컸습니다. 한 단계 더 보면 원인을 짚기 쉽습니다.'
      : band === 'moderate'
        ? '3분 체크에서 주의 신호가 조금 보였습니다. 관계·성향 쪽을 이어가면 좋습니다.'
        : '3분 체크는 안정적이었습니다. 성격 유형을 가볍게 이어가면 대화가 수월해집니다.';

  return { testId, name, pitch, rationale };
}

const DISMISS_PREFIX = 'counselorNextRecoDismissed:';

export function dismissNextTestRecommendation(portalId: string, assessmentId: string, testId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = `${DISMISS_PREFIX}${portalId}:${assessmentId}:${testId}`;
    window.localStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

export function isNextTestRecommendationDismissed(
  portalId: string,
  assessmentId: string,
  testId: string,
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = `${DISMISS_PREFIX}${portalId}:${assessmentId}:${testId}`;
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
