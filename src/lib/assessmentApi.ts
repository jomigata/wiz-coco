/**
 * 상담(코드) 플로우용 Flask 백엔드 API 클라이언트
 * NEXT_PUBLIC_FLASK_API_URL 미설정 시 개발용 localhost:5000 사용
 */

import { isValidAccessCodeInput, normalizeAccessCodeInput } from '@/lib/accessCodeFormat';
import { getCounselorToken, getCounselorUid, getCounselorUidSync, isCounselorRoleRequiredMessage, syncCounselorRoleViaApi } from '@/lib/counselorAuth';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { readClientPortalSession } from '@/lib/clientPortalSession';
import { getJoinParticipantAuthHeader } from '@/lib/joinParticipantSession';
import { getJoinGuestAuthHeader } from '@/lib/joinGuestSession';
import { isJoinFreshParticipantFlow } from '@/lib/joinFlowMode';
import { readSWRCache, writeSWRCache, clearSWRCacheByPrefix } from '@/utils/staleWhileRevalidateCache';

const FORCE_GUEST_ACCESS_CODE_KEY = 'wizcoco_force_guest_access_code';

export function setForceGuestForAccessCode(accessCodeNorm: string): void {
  if (typeof window === 'undefined') return;
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return;
  sessionStorage.setItem(FORCE_GUEST_ACCESS_CODE_KEY, code);
}

export function clearForceGuestForAccessCode(accessCodeNorm?: string): void {
  if (typeof window === 'undefined') return;
  if (!accessCodeNorm) {
    sessionStorage.removeItem(FORCE_GUEST_ACCESS_CODE_KEY);
    return;
  }
  const code = normalizeAccessCodeInput(accessCodeNorm);
  const stored = sessionStorage.getItem(FORCE_GUEST_ACCESS_CODE_KEY);
  if (stored === code) {
    sessionStorage.removeItem(FORCE_GUEST_ACCESS_CODE_KEY);
  }
}

function shouldForceGuestForAccessCode(accessCodeNorm?: string): boolean {
  if (typeof window === 'undefined' || !accessCodeNorm) return false;
  const stored = sessionStorage.getItem(FORCE_GUEST_ACCESS_CODE_KEY);
  if (!stored) return false;
  return stored === normalizeAccessCodeInput(accessCodeNorm);
}

const getBaseUrl = (): string => {
  // 1순위: 환경 변수(NEXT_PUBLIC_FLASK_API_URL)
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }

  // 2순위: Firebase Hosting 등 정적 배포(브라우저)에서는 동일 오리진 사용
  // (Hosting에서 /api/** 를 Flask/Cloud Run 등으로 리라이트한다고 가정)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }

  // 개발 환경 기본값: 로컬 Flask
  return 'http://localhost:5000';
};

/** @deprecated import from @/lib/counselorAuth */
export { getCounselorToken } from '@/lib/counselorAuth';

/** 결과 API — 포털 세션 우선, 이후 참여·게스트 (accessCode 와 일치하는 세션만 사용) */
export async function getClientResultAuthHeaders(
  accessCodeNorm?: string
): Promise<Record<string, string>> {
  const code = accessCodeNorm ? normalizeAccessCodeInput(accessCodeNorm) : undefined;
  const skipPortal = Boolean(code && isJoinFreshParticipantFlow(code));
  if (code && shouldForceGuestForAccessCode(code)) {
    const guest = getJoinGuestAuthHeader(code);
    if (guest.Authorization) return guest;
  }
  if (!skipPortal) {
    const portal = readClientPortalSession();
    if (portal?.portalToken) {
      return { Authorization: `Portal ${portal.portalToken}` };
    }
  }
  const participant = getJoinParticipantAuthHeader(code);
  if (participant.Authorization) return participant;
  const guest = getJoinGuestAuthHeader(code);
  if (guest.Authorization) return guest;
  const token = await getCounselorToken();
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export function hasParticipantSessionForResults(accessCodeNorm?: string): boolean {
  return Boolean(getJoinParticipantAuthHeader(accessCodeNorm).Authorization);
}

export function hasGuestSessionForResults(accessCodeNorm?: string): boolean {
  return Boolean(getJoinGuestAuthHeader(accessCodeNorm).Authorization);
}

export function hasPortalSessionForResults(): boolean {
  return Boolean(readClientPortalSession()?.portalToken);
}

export function canTrackJoinResults(accessCodeNorm?: string): boolean {
  if (accessCodeNorm && isJoinFreshParticipantFlow(accessCodeNorm)) {
    return (
      hasParticipantSessionForResults(accessCodeNorm) ||
      hasGuestSessionForResults(accessCodeNorm)
    );
  }
  return (
    hasPortalSessionForResults() ||
    hasParticipantSessionForResults(accessCodeNorm) ||
    hasGuestSessionForResults(accessCodeNorm)
  );
}

export interface PublicAssessment {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  issueType?: 'shared' | 'individual';
}

const MSG_LOOKUP_DEFAULT =
  '요청하신 상담(코드)가 확인되지 않았습니다. 상담(코드)를 다시 확인해 주시기 바랍니다.';

export interface TestResultItem {
  resultId: string;
  testId: string;
  status: string;
  completedAt: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  isShared?: boolean;
  sourceAccessCode?: string;
}

/** POST /api/assessments/public/lookup — 활성 상담(코드)만으로 세트 정보 조회 */
export async function lookupPublicAssessment(accessCode: string): Promise<PublicAssessment> {
  const code = normalizeAccessCodeInput(accessCode || '');
  if (!isValidAccessCodeInput(code)) {
    throw new Error('상담(코드) 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주시기 바랍니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/assessments/public/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : MSG_LOOKUP_DEFAULT
    );
  }
  return data as PublicAssessment;
}

/** POST /api/results - 결과 제출 (Firebase ID 토큰 필수, 내담자 이메일은 토큰과 동일하게 저장) */
export async function submitResult(body: {
  accessCode: string;
  testId: string;
  responses: Record<string, unknown> | unknown[];
}): Promise<{
  resultId: string;
  message: string;
  resultData?: {
    hookMessage?: string;
    summary?: string;
    counselorNote?: string;
  };
}> {
  const code = normalizeAccessCodeInput(body.accessCode || '');
  const authHeaders = await getClientResultAuthHeaders(code);
  if (!authHeaders.Authorization) {
    throw new Error('검사 세션이 없습니다. 상담(코드) 입력부터 다시 시작해 주세요.');
  }
  const res = await fetch(`${getBaseUrl()}/api/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({
      accessCode: code,
      testId: (body.testId || '').trim(),
      responses: body.responses,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '제출에 실패했습니다.');
  }
  return data;
}

/** GET /api/results/:resultId?password= — 레거시( passwordHash 있는 문서) 조회용 */
export async function getResult(
  resultId: string,
  password: string
): Promise<{ resultId: string; testId: string; responses: unknown; clientEmail: string }> {
  const res = await fetch(
    `${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}?password=${encodeURIComponent(password)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '조회에 실패했습니다.');
  }
  return data;
}

/** 로그인 사용자 본인의 상담(코드) 세트 제출 결과 전체 (마이페이지용) */
export interface MyAssessmentResultRow {
  resultId: string;
  accessCode: string;
  assessmentId: string;
  assessmentTitle?: string | null;
  /** 상담(코드) 사용최종일 YYYY-MM-DD, 미설정 시 무기한 */
  usageEndDate?: string | null;
  testId: string;
  status?: string;
  completedAt: string | null;
}

export async function listMyAssessmentResults(): Promise<{ results: MyAssessmentResultRow[] }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/results/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '목록을 불러오지 못했습니다.');
  }
  return data as { results: MyAssessmentResultRow[] };
}

/** GET /api/results/:id + Participant/Guest/Portal 세션 — 소유자 응답 조회 */
export async function getClientResult(
  resultId: string,
  accessCode?: string
): Promise<{
  resultId: string;
  testId: string;
  responses: unknown;
  clientEmail?: string;
  resultData?: Record<string, unknown> | null;
  accessCode?: string;
  assessmentId?: string;
}> {
  const code = accessCode ? normalizeAccessCodeInput(accessCode) : undefined;
  const authHeaders = await getClientResultAuthHeaders(code);
  if (!authHeaders.Authorization) {
    throw new Error('검사 참여 세션이 필요합니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    headers: authHeaders,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '조회에 실패했습니다.');
  }
  return data;
}

/** PUT /api/results/:id + Participant/Guest/Portal 세션 — 소유자 응답 수정 */
export async function updateClientResult(
  resultId: string,
  body: { responses: Record<string, unknown> | unknown[] },
  accessCode?: string
): Promise<{ resultId: string; message: string }> {
  const code = accessCode ? normalizeAccessCodeInput(accessCode) : undefined;
  const authHeaders = await getClientResultAuthHeaders(code);
  if (!authHeaders.Authorization) {
    throw new Error('검사 참여 세션이 필요합니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '수정에 실패했습니다.');
  }
  return data;
}

/** GET /api/results/:id + Bearer — 소유자만 요약·응답 조회 */
export async function getResultAsAuthenticatedOwner(resultId: string): Promise<{
  resultId: string;
  testId: string;
  responses: unknown;
  clientEmail: string;
  resultData?: Record<string, unknown> | null;
  accessCode?: string;
  assessmentId?: string;
}> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '조회에 실패했습니다.');
  }
  return data as {
    resultId: string;
    testId: string;
    responses: unknown;
    clientEmail: string;
    resultData?: Record<string, unknown> | null;
    accessCode?: string;
    assessmentId?: string;
  };
}

/** GET /api/results?accessCode= — 로그인 사용자(토큰 이메일) 기준 완료 검사 목록 */
export async function listResults(accessCode: string): Promise<{ results: TestResultItem[] }> {
  const code = normalizeAccessCodeInput(accessCode || '');
  if (!isValidAccessCodeInput(code)) {
    throw new Error('상담(코드)를 확인해 주세요.');
  }
  const authHeaders = await getClientResultAuthHeaders(code);
  if (!authHeaders.Authorization) throw new Error('검사 참여 세션이 필요합니다. 상담(코드) 입력부터 다시 시도해 주세요.');
  const params = new URLSearchParams({ accessCode: code });
  const res = await fetch(`${getBaseUrl()}/api/results?${params}`, {
    headers: authHeaders,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '목록 조회에 실패했습니다.');
  }
  return data;
}

/** PUT /api/results/:resultId — 로그인 소유자는 password 생략, 레거시 문서만 password */
export async function updateResult(
  resultId: string,
  body: { password?: string; responses: Record<string, unknown> | unknown[] }
): Promise<{ resultId: string; message: string }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '수정에 실패했습니다.');
  }
  return data;
}

/** DELETE /api/results/:resultId — 로그인 소유자는 password 생략, 레거시만 password */
export async function deleteResult(
  resultId: string,
  legacyPassword?: string,
  accessCode?: string
): Promise<void> {
  const code = accessCode ? normalizeAccessCodeInput(accessCode) : undefined;
  const authHeaders = await getClientResultAuthHeaders(code);
  if (!authHeaders.Authorization) throw new Error('검사 참여 세션이 필요합니다. 프로필 등록 후 다시 시도해 주세요.');
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(legacyPassword ? { password: legacyPassword } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '삭제에 실패했습니다.');
  }
}

// --- 상담사 전용 API (Firebase ID 토큰 필요) ---

export interface CounselorAssessment {
  id: string;
  accessCode: string;
  counselorId: string;
  title: string;
  issueType?: 'shared' | 'individual';
  targetAudience: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  createdAt: string;
  status?: string;
  updatedAt?: string;
  archivedAt?: string;
  /** 1건 이상 제출했으나 세트 전부를 완료하지 않은 서로 다른 이메일 수 */
  emailsNotCompletedAllTestsCount?: number;
  /** 포함된 검사를 모두 완료 제출한 서로 다른 이메일 수 */
  emailsCompletedAllTestsCount?: number;
  /** 발송목록 기준 발송 성공·실패·검사 완료·미완료 인원 */
  dispatchSentCount?: number;
  dispatchFailedCount?: number;
  dispatchSendingCount?: number;
  testCompleteCount?: number;
  testIncompleteCount?: number;
  /** 기관/단체/그룹명 (상담코드 세트) */
  cohortName?: string;
  /** 상담코드 유형: individual | group | school | corporate | community | other */
  codeCategory?: string;
  /** 관리자 목록 — 상담사 이메일 */
  counselorEmail?: string;
}

/** 상담(코드) 발급 직후 목록 상단 배너용(세션에서 전달) */
export interface CreatedAssessmentBannerInfo {
  accessCode: string;
  cohortName?: string;
  title?: string;
}

/** 내담자 상담코드 이동 완료 후 목록 상단 배너용(세션에서 전달) */
export interface PortalMoveBannerInfo {
  moved: number;
  targetAssessmentTitle: string;
  targetAccessCode: string;
  targetCohortName?: string;
  recipients: { displayName: string; myCode?: string }[];
}

const PORTAL_MOVE_BANNER_KEY = 'wizcoco_portal_move_banner';

export function writePortalMoveBanner(info: PortalMoveBannerInfo): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PORTAL_MOVE_BANNER_KEY, JSON.stringify(info));
  } catch {
    /* ignore */
  }
}

export function readPortalMoveBanner(): PortalMoveBannerInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PORTAL_MOVE_BANNER_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PORTAL_MOVE_BANNER_KEY);
    return JSON.parse(raw) as PortalMoveBannerInfo;
  } catch {
    return null;
  }
}

export interface ProgressByClient {
  clientUid: string;
  clientEmail?: string | null;
  clientDisplayName?: string | null;
  results: { resultId: string; testId: string; status: string; completedAt: string | null }[];
}

/** POST /api/assessments - 상담사: 공동 이용 상담(코드)(세트) 생성 */
export async function createAssessment(body: {
  title: string;
  issueType?: 'shared' | 'individual';
  targetAudience?: '개인' | '그룹';
  welcomeMessage?: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
}): Promise<{ assessmentId: string; accessCode: string; issueType?: string }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: (body.title || '').trim(),
      issueType: body.issueType || 'shared',
      welcomeMessage: (body.welcomeMessage || '').trim(),
      usageEndDate: (body.usageEndDate || '').trim(),
      testList: body.testList || [],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '상담(코드)생성에 실패했습니다.');
  }
  return data;
}

/** GET /api/assessments/:id - 상담사: 단일 상담(코드)(세트) 조회 */
export async function getAssessment(assessmentId: string): Promise<CounselorAssessment> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/${encodeURIComponent(assessmentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '조회에 실패했습니다.');
  }
  return data as CounselorAssessment;
}

/** PUT /api/assessments/:id - 상담사: 상담(코드) 세트 수정 (코드 문자열 불변) */
export async function updateAssessment(
  assessmentId: string,
  body: {
    title: string;
    targetAudience?: '개인' | '그룹';
    welcomeMessage?: string;
    usageEndDate?: string;
    codeCategory?: string;
    testList: { testId: string; name: string }[];
  }
): Promise<{ assessmentId: string; message: string }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/${encodeURIComponent(assessmentId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: (body.title || '').trim(),
      targetAudience: body.targetAudience || '개인',
      welcomeMessage: (body.welcomeMessage || '').trim(),
      usageEndDate: (body.usageEndDate || '').trim(),
      codeCategory: (body.codeCategory || '').trim(),
      testList: body.testList || [],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '수정에 실패했습니다.');
  }
  return data;
}

/** DELETE /api/assessments/:id - 상담사: 상담(코드) 세트 비활성화(archived), 신규 접속 불가 */
export async function deleteAssessment(
  assessmentId: string,
  accessCode?: string,
): Promise<void> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const id = (assessmentId || '').trim();
  const code = accessCode ? normalizeAccessCodeInput(accessCode) : '';
  const params = code ? `?accessCode=${encodeURIComponent(code)}` : '';
  const pathId = id || code;
  if (!pathId) throw new Error('삭제할 상담(코드) 정보가 없습니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/assessments/${encodeURIComponent(pathId)}${params}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '삭제에 실패했습니다.');
  }
}

export type ArchivedAssessment = {
  id: string;
  accessCode: string;
  codeCategory?: string;
  title: string;
  targetAudience: string;
  cohortName: string;
  usageEndDate?: string;
  createdAt?: string | null;
  archivedAt: string | null;
  dispatchSentCount?: number;
  dispatchFailedCount?: number;
  testCompleteCount?: number;
  testIncompleteCount?: number;
  counselorId?: string;
  counselorEmail?: string;
};

export async function listArchivedAssessments(params?: {
  ownOnly?: boolean;
}): Promise<{ assessments: ArchivedAssessment[]; globalTotalCount?: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const qs = params?.ownOnly ? '?ownOnly=1' : '';
  const res = await fetch(`${getBaseUrl()}/api/assessments/archived${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '삭제 목록 조회에 실패했습니다.');
  }
  return data as { assessments: ArchivedAssessment[]; globalTotalCount?: number };
}

export async function restoreArchivedAssessments(
  assessmentIds: string[],
): Promise<{ restored: number; failed: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/archived/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assessmentIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '복구에 실패했습니다.');
  }
  return data as { restored: number; failed: number };
}

export async function permanentlyDeleteArchivedAssessments(
  assessmentIds: string[],
): Promise<{ deleted: number; failed: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/archived/permanent-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assessmentIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '영구 삭제에 실패했습니다.');
  }
  return data as { deleted: number; failed: number };
}

/** GET /api/assessments - 상담사: 내 상담(코드) 목록 */
const ASSESSMENTS_LIST_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ASSESSMENTS_LIST_CACHE_SCOPE = 'local' as const;
const LEGACY_ASSESSMENTS_LIST_CACHE_KEY = 'swr:counselorAssessmentsList';

export interface AssessmentListPageResult {
  assessments: CounselorAssessment[];
  nextCursor?: string | null;
  hasMore?: boolean;
  limit?: number;
  globalTotalCount?: number;
}

export interface AssessmentListStats {
  dispatchSentCount?: number;
  dispatchFailedCount?: number;
  dispatchSendingCount?: number;
  testCompleteCount?: number;
  testIncompleteCount?: number;
  emailsCompletedAllTestsCount?: number;
  emailsNotCompletedAllTestsCount?: number;
}

export async function listAssessmentsPage(params?: {
  limit?: number;
  cursor?: string | null;
  q?: string;
  includeStats?: boolean;
  counselorId?: string;
  ownOnly?: boolean;
}): Promise<AssessmentListPageResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.q?.trim()) search.set('q', params.q.trim());
  if (params?.counselorId?.trim()) search.set('counselorId', params.counselorId.trim());
  if (params?.includeStats === false) search.set('includeStats', '0');
  if (params?.ownOnly) search.set('ownOnly', '1');

  const qs = search.toString() ? `?${search.toString()}` : '';
  const fetchPage = async (retried = false): Promise<AssessmentListPageResult> => {
    const authToken = await getCounselorToken();
    if (!authToken) throw new Error('로그인이 필요합니다.');
    const res = await fetch(`${getBaseUrl()}/api/assessments${qs}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || '목록 조회에 실패했습니다.';
      if (!retried && res.status === 403 && isCounselorRoleRequiredMessage(msg)) {
        const synced = await syncCounselorRoleViaApi();
        if (synced) return fetchPage(true);
      }
      throw new Error(msg);
    }
    return data as AssessmentListPageResult;
  };
  return fetchPage();
}

export async function fetchAssessmentListStats(
  assessmentIds: string[],
): Promise<Record<string, AssessmentListStats>> {
  const ids = assessmentIds.filter(Boolean);
  if (!ids.length) return {};

  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const res = await fetch(
    `${getBaseUrl()}/api/assessments/stats?ids=${encodeURIComponent(ids.slice(0, 100).join(','))}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '통계 조회에 실패했습니다.');
  }
  return (data.stats || {}) as Record<string, AssessmentListStats>;
}

export function mergeAssessmentListStats(
  items: CounselorAssessment[],
  statsMap: Record<string, AssessmentListStats>,
): CounselorAssessment[] {
  if (!items.length || !Object.keys(statsMap).length) return items;
  return items.map((item) => {
    const stats = statsMap[item.id];
    if (!stats) return item;
    return { ...item, ...stats };
  });
}

function assessmentsListCacheKey(counselorUid?: string | null): string | null {
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  return uid ? `swr:counselorAssessmentsList:${uid}` : null;
}

function filterAssessmentsForCounselor(
  items: CounselorAssessment[],
  counselorUid: string,
): CounselorAssessment[] {
  if (isAdmin(getAppRoleSync())) return items;
  return items.filter((a) => !a.counselorId || a.counselorId === counselorUid);
}

/** 상담코드 이동 대상 — 로그인 상담사가 생성한 활성 코드만 */
export function filterCounselorAssessmentsForPortalMove(
  assessments: CounselorAssessment[],
  counselorUid: string,
  options?: { excludeAssessmentId?: string },
): CounselorAssessment[] {
  const uid = counselorUid.trim();
  const excludeId = options?.excludeAssessmentId?.trim();
  return (assessments || []).filter(
    (a) =>
      Boolean(a.id) &&
      a.counselorId === uid &&
      (a.status || 'active') === 'active' &&
      a.id !== excludeId,
  );
}

export function readCachedAssessmentsList(counselorUid?: string | null): CounselorAssessment[] | null {
  if (typeof window === 'undefined') return null;
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  if (!uid) return null;
  const cacheKey = assessmentsListCacheKey(uid);
  if (!cacheKey) return null;
  const cached = readSWRCache<{ assessments: CounselorAssessment[] }>(cacheKey, {
    scope: ASSESSMENTS_LIST_CACHE_SCOPE,
    maxAgeMs: ASSESSMENTS_LIST_CACHE_MAX_AGE_MS,
  });
  if (cached.isFresh && cached.data?.assessments?.length) {
    return filterAssessmentsForCounselor(cached.data.assessments, uid);
  }
  // legacy: uid 없는 공용 키 — 현재 상담사 항목만 마이그레이션
  const legacy = readSWRCache<{ assessments: CounselorAssessment[] }>(LEGACY_ASSESSMENTS_LIST_CACHE_KEY, {
    scope: ASSESSMENTS_LIST_CACHE_SCOPE,
    maxAgeMs: ASSESSMENTS_LIST_CACHE_MAX_AGE_MS,
  });
  if (legacy.isFresh && legacy.data?.assessments?.length) {
    const scoped = filterAssessmentsForCounselor(legacy.data.assessments, uid);
    if (scoped.length) {
      writeSWRCache(cacheKey, { assessments: scoped }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
      return scoped;
    }
  }
  const legacySession = readSWRCache<{ assessments: CounselorAssessment[] }>(LEGACY_ASSESSMENTS_LIST_CACHE_KEY, {
    scope: 'session',
    maxAgeMs: ASSESSMENTS_LIST_CACHE_MAX_AGE_MS,
  });
  if (legacySession.isFresh && legacySession.data?.assessments?.length) {
    const scoped = filterAssessmentsForCounselor(legacySession.data.assessments, uid);
    if (scoped.length) {
      writeSWRCache(cacheKey, { assessments: scoped }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
      return scoped;
    }
  }
  return null;
}

function sortAssessmentsByCreatedDesc(items: CounselorAssessment[]): CounselorAssessment[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
}

/** API·캐시 항목 id 정규화 (assessmentId 필드만 있는 경우 대비) */
export function normalizeCounselorAssessment(
  a: CounselorAssessment & { assessmentId?: string },
): CounselorAssessment {
  const id = (a.id || a.assessmentId || '').trim();
  return { ...a, id };
}

function assessmentAccessKey(accessCode?: string): string {
  return accessCode ? normalizeAccessCodeInput(accessCode) : '';
}

/** 서버 목록 + 세션 캐시(낙관적 추가분) 병합 — 서버 항목이 동일 id·accessCode면 우선 */
export function mergeCounselorAssessmentLists(
  fromServer: CounselorAssessment[],
  fromCache: CounselorAssessment[],
  counselorUid?: string | null,
): CounselorAssessment[] {
  const uid = counselorUid?.trim();
  const scopeToCounselor = uid && !isAdmin(getAppRoleSync());
  const serverItems = (fromServer || [])
    .map(normalizeCounselorAssessment)
    .filter((a) => a.id && (!scopeToCounselor || !a.counselorId || a.counselorId === uid));
  const cacheItems = (fromCache || [])
    .map(normalizeCounselorAssessment)
    .filter((a) => a.id && (!scopeToCounselor || !a.counselorId || a.counselorId === uid));

  const byId = new Map<string, CounselorAssessment>();
  const serverAccessCodes = new Set(
    serverItems.map((a) => assessmentAccessKey(a.accessCode)).filter(Boolean),
  );

  for (const a of cacheItems) {
    const codeKey = assessmentAccessKey(a.accessCode);
    if (codeKey && serverAccessCodes.has(codeKey)) continue;
    byId.set(a.id, a);
  }
  for (const a of serverItems) {
    byId.set(a.id, a);
  }
  return sortAssessmentsByCreatedDesc(Array.from(byId.values()));
}

/** 발급 직후 목록에 바로 보이도록 세션 캐시 앞에 추가 */
export function prependCounselorAssessmentToListCache(item: CounselorAssessment): void {
  if (typeof window === 'undefined' || !item.id) return;
  const uid = (item.counselorId || getCounselorUidSync())?.trim();
  if (!uid) return;
  const cacheKey = assessmentsListCacheKey(uid);
  if (!cacheKey) return;
  const normalized = normalizeCounselorAssessment({ ...item, counselorId: item.counselorId || uid });
  const existing = readCachedAssessmentsList(uid) ?? [];
  const codeKey = assessmentAccessKey(normalized.accessCode);
  const rest = existing.filter(
    (a) =>
      a.id !== normalized.id &&
      (!codeKey || assessmentAccessKey(a.accessCode) !== codeKey),
  );
  writeSWRCache(
    cacheKey,
    { assessments: sortAssessmentsByCreatedDesc([normalized, ...rest]) },
    { scope: ASSESSMENTS_LIST_CACHE_SCOPE },
  );
}

/** 삭제 성공 후 세션 캐시에서 제거 */
export function removeCounselorAssessmentFromListCache(
  assessmentId: string,
  accessCode?: string,
  counselorUid?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  const cacheKey = uid ? assessmentsListCacheKey(uid) : null;
  if (!cacheKey) return;
  const id = assessmentId.trim();
  const codeKey = assessmentAccessKey(accessCode);
  if (!id && !codeKey) return;
  const existing = readCachedAssessmentsList(uid) ?? [];
  const filtered = existing.filter((a) => {
    if (id && a.id === id) return false;
    if (codeKey && assessmentAccessKey(a.accessCode) === codeKey) return false;
    return true;
  });
  writeSWRCache(cacheKey, { assessments: filtered }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
}

/** 상담코드 목록 localStorage 캐시 비우기 (DB purge 후 stale 목록 정리) */
export function clearCounselorAssessmentsListCache(counselorUid?: string | null): void {
  if (typeof window === 'undefined') return;
  const uid = (counselorUid ?? getCounselorUidSync())?.trim();
  clearSWRCacheByPrefix('swr:counselorAssessmentsList', ['local', 'session']);
  if (uid) {
    const cacheKey = assessmentsListCacheKey(uid);
    if (cacheKey) {
      writeSWRCache(cacheKey, { assessments: [] }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
    }
  }
  writeSWRCache(LEGACY_ASSESSMENTS_LIST_CACHE_KEY, { assessments: [] }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
  writeSWRCache(LEGACY_ASSESSMENTS_LIST_CACHE_KEY, { assessments: [] }, { scope: 'session' });
}

export async function listAssessments(params?: {
  q?: string;
  counselorId?: string;
  includeStats?: boolean;
  ownOnly?: boolean;
}): Promise<{ assessments: CounselorAssessment[]; globalTotalCount?: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const counselorUid = (await getCounselorUid())?.trim();
  if (!counselorUid) throw new Error('로그인이 필요합니다.');

  const mergedItems: CounselorAssessment[] = [];
  let cursor: string | null | undefined;
  do {
    const page = await listAssessmentsPage({
      ...params,
      cursor,
      limit: 100,
      includeStats: params?.includeStats ?? true,
    });
    mergedItems.push(...(page.assessments || []));
    cursor = page.nextCursor;
  } while (cursor);

  const cacheKey = assessmentsListCacheKey(counselorUid);
  if (!mergedItems.length) {
    clearCounselorAssessmentsListCache(counselorUid);
    return { assessments: [] };
  }

  if (cacheKey) {
    writeSWRCache(cacheKey, { assessments: mergedItems }, { scope: ASSESSMENTS_LIST_CACHE_SCOPE });
  }
  return { assessments: mergedItems };
}

/** GET /api/assessments/:id/progress - 상담사: 해당 상담(코드) 진행 현황 */
export async function getProgress(
  assessmentId: string
): Promise<{ accessCode: string; byClient: ProgressByClient[] }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/${encodeURIComponent(assessmentId)}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback = '진행 현황 조회에 실패했습니다.';
    const msg =
      typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : typeof data?.error === 'string' && data.error.trim()
          ? data.error.trim()
          : fallback;
    throw new Error(msg);
  }
  return data;
}

/** 상담사 전용: 검사 결과 상세 */
export interface CounselorResultDetail {
  resultId: string;
  assessmentId: string;
  accessCode: string;
  testId: string;
  clientEmail: string;
  clientDisplayName?: string;
  status: string;
  responses: Record<string, unknown> | unknown[];
  resultData: Record<string, unknown> | null;
  completedAt: string | null;
}

/** GET /api/assessments/:assessmentId/results/:resultId - 상담사: 결과 상세 조회 */
export async function getCounselorResult(
  assessmentId: string,
  resultId: string
): Promise<CounselorResultDetail> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/assessments/${encodeURIComponent(assessmentId)}/results/${encodeURIComponent(resultId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '결과 조회에 실패했습니다.');
  }
  return data;
}
