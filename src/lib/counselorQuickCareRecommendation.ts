import type { DispatchTestResult } from '@/lib/clientPortalApi';
import type { CreateCareAssignmentInput } from '@/types/careAssignment';

export type QuickCarePresetId = 'breathing_3min' | 'mood_journal_3d';

export type CounselorQuickCareRecommendation = {
  presetId: QuickCarePresetId;
  title: string;
  pitch: string;
  rationale: string;
  payload: Pick<
    CreateCareAssignmentInput,
    'type' | 'title' | 'instructions' | 'priority' | 'programId' | 'metadata'
  > & { dueDays: number };
};

function formatDueDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function bandFromTests(tests: DispatchTestResult[]): 'high' | 'moderate' | 'low' | null {
  const generic = tests.find((t) => t.testId === 'generic' && t.status === 'completed');
  if (generic?.miniCheckBand === 'high' || generic?.miniCheckBand === 'moderate' || generic?.miniCheckBand === 'low') {
    return generic.miniCheckBand;
  }
  if (generic) return 'moderate';
  const anyCompleted = tests.some((t) => t.status === 'completed');
  return anyCompleted ? 'moderate' : null;
}

const PRESETS: Record<
  QuickCarePresetId,
  Omit<CounselorQuickCareRecommendation, 'pitch' | 'rationale'>
> = {
  breathing_3min: {
    presetId: 'breathing_3min',
    title: '3분 호흡 숙제',
    payload: {
      type: 'custom_task',
      title: '3분 호흡 숙제',
      instructions:
        '편한 자세로 4초 들이마시고 6초 내쉬기를 10회 반복합니다. 어지러우면 횟수를 줄이세요.',
      priority: 'medium',
      dueDays: 3,
    },
  },
  mood_journal_3d: {
    presetId: 'mood_journal_3d',
    title: '짧은 기분 기록 (3일)',
    payload: {
      type: 'daily_record',
      title: '짧은 기분 기록 (3일)',
      instructions: '오늘 기분을 1~10점과 한 줄 메모만 적어 주세요. 3분이면 충분합니다.',
      priority: 'medium',
      dueDays: 3,
      metadata: { targetDays: 3, quickCare: true },
    },
  },
};

/** 검사 완료 후 — 짧은 숙제 1개만 추천 (호흡·기록) */
export function resolveCounselorQuickCareRecommendation(
  tests: DispatchTestResult[],
): CounselorQuickCareRecommendation | null {
  if (!tests.length) return null;

  const band = bandFromTests(tests);
  if (!band) return null;

  const presetId: QuickCarePresetId = band === 'high' ? 'breathing_3min' : 'mood_journal_3d';
  const base = PRESETS[presetId];

  const pitch =
    presetId === 'breathing_3min'
      ? '이번 주는 3분 호흡만 해도 몸이 조금 가벼워질 수 있습니다.'
      : '짧은 기분 기록으로 변화를 함께 살펴봅시다.';

  const rationale =
    band === 'high'
      ? '스트레스·피로 신호가 있어, 부담 없는 호흡 숙제가 잘 맞습니다.'
      : '짧은 기록으로 패턴을 보기 쉽습니다. 길게 쓰지 않아도 됩니다.';

  return { ...base, pitch, rationale };
}

export function buildQuickCareAssignmentInput(
  portalIds: string[],
  recommendation: CounselorQuickCareRecommendation,
): CreateCareAssignmentInput {
  const { payload } = recommendation;
  return {
    portalIds,
    type: payload.type,
    title: payload.title,
    instructions: payload.instructions,
    priority: payload.priority,
    programId: payload.programId,
    dueAt: formatDueDate(payload.dueDays),
    notify: true,
    source: 'assessment_result',
    metadata: payload.metadata,
  };
}

const DISMISS_PREFIX = 'counselorQuickCareDismissed:';

export function dismissQuickCareRecommendation(portalId: string, presetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${DISMISS_PREFIX}${portalId}:${presetId}`, '1');
  } catch {
    // ignore
  }
}

export function isQuickCareRecommendationDismissed(portalId: string, presetId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(`${DISMISS_PREFIX}${portalId}:${presetId}`) === '1';
  } catch {
    return false;
  }
}
