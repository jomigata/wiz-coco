/**
 * 검사코드 참여 세션: 브라우저 sessionStorage에 세트 메타만 보관합니다.
 */
import { lookupPublicAssessment } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { markInternalNavigation, pushWithAuthSession } from '@/utils/authSessionLifecycle';

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

/** 검사하기(/join) 진입 URL — accessCode 쿼리·자동 진행 옵션 */
export function getJoinEntryPath(accessCodeNorm: string, autoStart = false): string {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return '/join';
  const params = new URLSearchParams({ accessCode: code });
  if (autoStart) params.set('auto', '1');
  return `/join?${params.toString()}`;
}

export function getJoinDashboardPath(accessCodeNorm: string): string {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return '/join';
  return `/join/dashboard?accessCode=${encodeURIComponent(code)}`;
}

/** 검사 선택 현황으로 이동 (전체 페이지 이동) */
export function navigateToJoinSelectionDashboard(accessCodeNorm: string): void {
  if (typeof window === 'undefined') return;
  const path = getJoinDashboardPath(accessCodeNorm);
  if (path === '/join') return;
  markInternalNavigation();
  window.location.assign(path);
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
