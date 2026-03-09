/**
 * 참여 코드 플로우용 Flask 백엔드 API 클라이언트
 * NEXT_PUBLIC_FLASK_API_URL 미설정 시 개발용 localhost:5000 사용
 */

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000';
  }
  return process.env.NEXT_PUBLIC_FLASK_API_URL || 'http://localhost:5000';
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

export interface TestResultItem {
  resultId: string;
  testId: string;
  status: string;
  completedAt: string | null;
}

/** GET /api/assessments/public/:accessCode - 코드 유효 시 패키지 정보 반환 */
export async function getPublicAssessment(accessCode: string): Promise<PublicAssessment> {
  const code = (accessCode || '').trim().toUpperCase();
  if (code.length !== 6) {
    throw new Error('참여 코드는 6자리입니다.');
  }
  const res = await fetch(`${getBaseUrl()}/api/assessments/public/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || '유효하지 않은 참여 코드입니다.');
  }
  return res.json();
}

/** POST /api/results - 결과 제출 */
export async function submitResult(body: {
  accessCode: string;
  testId: string;
  clientEmail: string;
  responses: Record<string, unknown> | unknown[];
}): Promise<{ resultId: string; message: string }> {
  const res = await fetch(`${getBaseUrl()}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessCode: (body.accessCode || '').trim().toUpperCase(),
      testId: (body.testId || '').trim(),
      clientEmail: (body.clientEmail || '').trim().toLowerCase(),
      responses: body.responses,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '제출에 실패했습니다.');
  }
  return data;
}

/** GET /api/results/:resultId?password= - 비밀번호로 단일 결과 조회 (수정 폼용) */
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

/** GET /api/results?accessCode=&clientEmail= - 이메일별 완료 검사 목록 */
export async function listResults(
  accessCode: string,
  clientEmail: string
): Promise<{ results: TestResultItem[] }> {
  const code = (accessCode || '').trim().toUpperCase();
  const email = (clientEmail || '').trim().toLowerCase();
  if (code.length !== 6 || !email || !email.includes('@')) {
    throw new Error('참여 코드와 이메일을 확인해 주세요.');
  }
  const params = new URLSearchParams({ accessCode: code, clientEmail: email });
  const res = await fetch(`${getBaseUrl()}/api/results?${params}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '목록 조회에 실패했습니다.');
  }
  return data;
}

/** PUT /api/results/:resultId - 비밀번호 + responses 로 수정/재채점 */
export async function updateResult(
  resultId: string,
  body: { password: string; responses: Record<string, unknown> | unknown[] }
): Promise<{ resultId: string; message: string }> {
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || '수정에 실패했습니다.');
  }
  return data;
}

/** DELETE /api/results/:resultId - 비밀번호 확인 후 삭제 */
export async function deleteResult(resultId: string, password: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/results/${encodeURIComponent(resultId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
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
  status: string;
}

export interface ProgressByClient {
  clientEmail: string;
  results: { resultId: string; testId: string; status: string; completedAt: string | null }[];
}

/** POST /api/assessments - 상담사: 패키지 생성 */
export async function createAssessment(body: {
  title: string;
  targetAudience?: '개인' | '그룹';
  welcomeMessage?: string;
  testList: { testId: string; name: string }[];
}): Promise<{ assessmentId: string; accessCode: string }> {
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
    throw new Error(data?.message || data?.error || '패키지 생성에 실패했습니다.');
  }
  return data;
}

/** GET /api/assessments - 상담사: 내 패키지 목록 */
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

/** GET /api/assessments/:id/progress - 상담사: 해당 패키지 진행 현황 */
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
