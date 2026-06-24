/**
 * 검사코드 참여 세션: 브라우저 sessionStorage에 세트 메타만 보관합니다.
 */
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';

export const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

export type JoinAssessmentSessionPayload = {
  accessCode: string;
  assessmentId: string;
  title: string;
  welcomeMessage?: string;
  usageEndDate: string;
  testList: unknown;
};

export function persistJoinAssessmentSession(
  accessCodeNorm: string,
  data: Awaited<ReturnType<typeof lookupPublicAssessment>>,
): void {
  if (typeof window === 'undefined') return;
  const code = normalizeAccessCodeInput(accessCodeNorm);
  sessionStorage.setItem(
    JOIN_STORAGE_KEY,
    JSON.stringify({
      accessCode: code,
      assessmentId: data.assessmentId,
      title: data.title,
      welcomeMessage: data.welcomeMessage,
      usageEndDate: data.usageEndDate || '',
      testList: data.testList,
    } satisfies JoinAssessmentSessionPayload),
  );
}

export function clearJoinAssessmentSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(JOIN_STORAGE_KEY);
}

/** @deprecated 검사코드 직접 입력 제거 — 검사시작(포털 로그인) */
export function getJoinEntryPath(accessCodeNorm: string, autoStart = false): string {
  void accessCodeNorm;
  void autoStart;
  return '/portal/login/';
}

export function getJoinDashboardPath(accessCodeNorm: string): string {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return '/portal/';
  return `/join/dashboard?accessCode=${encodeURIComponent(code)}`;
}

/** 검사 선택 현황으로 이동 (Next router — 세션 유지) */
export function navigateToJoinSelectionDashboard(
  accessCodeNorm: string,
  router: { push: (href: string) => void },
): void {
  pushToJoinDashboard(router, accessCodeNorm);
}

/** 검사 선택 현황으로 이동 (Next router) */
export function pushToJoinDashboard(
  router: { push: (href: string) => void },
  accessCodeNorm: string
): void {
  pushWithAuthSession(router, getJoinDashboardPath(accessCodeNorm));
}

/** 검사코드 조회 후 검사 선택(대시보드) 화면으로 이동 */
export async function startJoinAssessmentFromAccessCode(
  router: { push: (href: string) => void },
  accessCodeNorm: string,
): Promise<{ ok: boolean; error?: string }> {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) {
    return { ok: false, error: '검사 코드가 없습니다.' };
  }
  try {
    const data = await lookupPublicAssessment(code);
    persistJoinAssessmentSession(code, data);
    pushToJoinDashboard(router, code);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : '검사 코드 확인에 실패했습니다.',
    };
  }
}
