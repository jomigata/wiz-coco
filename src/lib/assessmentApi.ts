/**
 * 검사 코드 플로우용 Flask 백엔드 API 클라이언트
 * NEXT_PUBLIC_FLASK_API_URL 미설정 시 개발용 localhost:5000 사용
 */

import {
  isValidAccessCodeInput,
  normalizeAccessCodeInput,
  normalizeJoinPinDigits,
} from '@/lib/accessCodeFormat';

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

/** 상담사 API 호출 시 Firebase ID 토큰 반환. 로그인 안 되어 있으면 null */
export async function getCounselorToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { initializeFirebase } = await import('@/lib/firebase');
    const { auth } = initializeFirebase();
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export interface PublicAssessment {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  testList: { testId: string; name: string }[];
}

const MSG_LOOKUP_DEFAULT =
  '요청하신 검사코드가 확인되지 않았습니다. 검사코드 및 비밀번호를 다시 한 번 확인해 주시기 바랍니다.';

export interface TestResultItem {
  resultId: string;
  testId: string;
  status: string;
  completedAt: string | null;
}

/**
 * POST /api/assessments/public/lookup — 검사코드 + 4자리 비밀번호(신규 세트는 필수, 구문서 미설정 시 생략 가능)
 */
export async function lookupPublicAssessment(
  accessCode: string,
  joinPin: string
): Promise<PublicAssessment> {
  const code = normalizeAccessCodeInput(accessCode || '');
  const pin = normalizeJoinPinDigits(joinPin);
  if (!isValidAccessCodeInput(code)) {
    throw new Error('검사 코드 형식이 올바르지 않습니다. 입력 내용을 다시 확인해 주시기 바랍니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/assessments/public/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: code, joinPin: pin }),
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
}> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      accessCode: normalizeAccessCodeInput(body.accessCode || ''),
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

/** 로그인 사용자 본인의 검사코드 세트 제출 결과 전체 (마이페이지용) */
export interface MyAssessmentResultRow {
  resultId: string;
  accessCode: string;
  assessmentId: string;
  assessmentTitle?: string | null;
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

/** GET /api/results/:id + Bearer — 소유자만 비밀번호 없이 요약·응답 조회 */
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
    throw new Error('검사 코드를 확인해 주세요.');
  }
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const params = new URLSearchParams({ accessCode: code });
  const res = await fetch(`${getBaseUrl()}/api/results?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
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
export async function deleteResult(resultId: string, legacyPassword?: string): Promise<void> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
  targetAudience: string;
  welcomeMessage: string;
  testList: { testId: string; name: string }[];
  createdAt: string;
  status?: string;
  updatedAt?: string;
  archivedAt?: string;
  /** 1건 이상 제출했으나 세트 전부를 완료하지 않은 서로 다른 이메일 수 */
  emailsNotCompletedAllTestsCount?: number;
  /** 포함된 검사를 모두 완료 제출한 서로 다른 이메일 수 */
  emailsCompletedAllTestsCount?: number;
  /** 상담사 목록·수정 화면용 평문 4자리(신규 저장분). 없으면 비노출/구데이터 */
  joinPin?: string;
  /** joinPinHash 존재 여부(평문 없는 구데이터 구분용) */
  joinPinConfigured?: boolean;
}

/** 검사코드 발급 직후 목록 상단 배너용(세션에서 전달) */
export interface CreatedAssessmentBannerInfo {
  accessCode: string;
  joinPin?: string;
}

export interface ProgressByClient {
  clientEmail: string;
  results: { resultId: string; testId: string; status: string; completedAt: string | null }[];
}

/** POST /api/assessments - 상담사: 검사코드(세트) 생성 */
export async function createAssessment(body: {
  title: string;
  targetAudience?: '개인' | '그룹';
  welcomeMessage?: string;
  testList: { testId: string; name: string }[];
}): Promise<{ assessmentId: string; accessCode: string; joinPin: string }> {
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
      targetAudience: body.targetAudience || '개인',
      welcomeMessage: (body.welcomeMessage || '').trim(),
      testList: body.testList || [],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '검사코드 만들기에 실패했습니다.');
  }
  return data;
}

/** GET /api/assessments/:id - 상담사: 단일 검사코드(세트) 조회 */
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

/** PUT /api/assessments/:id - 상담사: 검사코드 세트 수정 (코드 문자열 불변) */
export async function updateAssessment(
  assessmentId: string,
  body: {
    title: string;
    targetAudience?: '개인' | '그룹';
    welcomeMessage?: string;
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
      testList: body.testList || [],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '수정에 실패했습니다.');
  }
  return data;
}

/** DELETE /api/assessments/:id - 상담사: 검사코드 세트 비활성화(archived), 신규 접속 불가 */
export async function deleteAssessment(assessmentId: string): Promise<void> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments/${encodeURIComponent(assessmentId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '삭제에 실패했습니다.');
  }
}

/** GET /api/assessments - 상담사: 내 검사코드 목록 */
export async function listAssessments(): Promise<{ assessments: CounselorAssessment[] }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/assessments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.error || '목록 조회에 실패했습니다.');
  }
  return data;
}

/** GET /api/assessments/:id/progress - 상담사: 해당 검사코드 진행 현황 */
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
    throw new Error(data?.message || data?.error || '진행 현황 조회에 실패했습니다.');
  }
  return data;
}

/** 상담사 전용: 검사 결과 상세 (비밀번호 불필요) */
export interface CounselorResultDetail {
  resultId: string;
  assessmentId: string;
  accessCode: string;
  testId: string;
  clientEmail: string;
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
