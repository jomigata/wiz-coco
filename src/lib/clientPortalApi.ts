/**
 * 내담자 포털 Flask API 클라이언트
 */

import type {
  ClientPortalBulkCreateResult,
  ClientPortalBulkJobResult,
  ClientPortalLoginResult,
  BulkPortalJobStatus,
} from '@/types/clientPortal';
import { getCounselorToken } from '@/lib/assessmentApi';
import { normalizeAccessCodeInput, normalizeMyCodeInput, normalizeJoinPinDigits } from '@/lib/accessCodeFormat';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export async function loginClientPortal(body: {
  accessCode: string;
  pin: string;
  remember?: boolean;
}): Promise<ClientPortalLoginResult> {
  const res = await fetch(`${getBaseUrl()}/api/client-portals/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessCode: normalizeMyCodeInput(body.accessCode),
      pin: normalizeJoinPinDigits(body.pin),
      remember: Boolean(body.remember),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallback =
      res.status >= 500
        ? '로그인 서버 오류가 발생했습니다. 잠시 후 다시 시도하거나 이메일의 「바로 시작」 링크를 이용해 주세요.'
        : '나의코드 또는 비밀번호를 확인해 주세요.';
    throw new Error(
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : fallback,
    );
  }
  return data as ClientPortalLoginResult;
}

export async function verifyPortalMagicToken(token: string): Promise<ClientPortalLoginResult> {
  const res = await fetch(`${getBaseUrl()}/api/client-portals/magic-link/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : '링크가 만료되었거나 유효하지 않습니다.'
    );
  }
  return data as ClientPortalLoginResult;
}

export type PortalDashboardAssessment = {
  assessmentId: string;
  title: string;
  welcomeMessage: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  accessCode: string;
  issueType?: string;
  isLinkedShared?: boolean;
  isFromLinkedPortal?: boolean;
  sourceMyCode?: string;
  sourcePortalId?: string;
};

export type LinkedPortalSummary = {
  portalId: string;
  accessCode: string;
  displayName?: string;
};

export async function fetchPortalDashboard(portalToken: string): Promise<ClientPortalLoginResult['portal'] & {
  assessments: PortalDashboardAssessment[];
  linkedPortals?: LinkedPortalSummary[];
}> {
  const res = await fetch(`${getBaseUrl()}/api/client-portals/me`, {
    headers: { Authorization: `Portal ${portalToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '세션이 만료되었습니다.');
  }
  return data;
}

export async function bulkCreateClientPortals(body: {
  cohortName: string;
  rows: Array<{ displayName: string; email?: string; phone?: string }>;
  title: string;
  welcomeMessage?: string;
  usageEndDate?: string;
  testList: { testId: string; name: string }[];
  queueNotify?: boolean;
  scheduledAt?: string;
  /** 기존 그룹코드(개별 발급) 검사 세트 재사용 */
  assessmentId?: string;
}): Promise<ClientPortalBulkCreateResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/client-portals/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '일괄 생성에 실패했습니다.');
  }
  return data as ClientPortalBulkCreateResult;
}

export async function fetchBulkPortalJob(jobId: string): Promise<BulkPortalJobStatus> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/client-portals/bulk/jobs/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '작업 상태 조회에 실패했습니다.');
  }
  return data as BulkPortalJobStatus;
}

export async function fetchBulkPortalJobResult(jobId: string): Promise<ClientPortalBulkJobResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/bulk/jobs/${encodeURIComponent(jobId)}/result`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '발급 결과 조회에 실패했습니다.');
  }
  return data as ClientPortalBulkJobResult;
}

export type DispatchTestResult = {
  testId: string;
  testName: string;
  status: 'completed' | 'in_progress' | 'not_started';
  completedAt: string | null;
  resultId: string | null;
};

export type DispatchRecipient = {
  portalId: string;
  displayName: string;
  email: string;
  phone: string;
  myCode: string;
  joinAccessCode: string;
  notifyStatus: string;
  notifyError?: string | null;
  notifyAt?: string | null;
  notifySentVia?: string | null;
  testStatus: 'completed' | 'in_progress' | 'not_started';
  completedCount: number;
  requiredCount: number;
  tests: DispatchTestResult[];
};

export type AssessmentDispatchStatus = {
  assessmentId: string;
  title: string;
  cohortName: string;
  joinAccessCode: string;
  testList: { testId: string; name: string }[];
  recipients: DispatchRecipient[];
};

export async function fetchAssessmentDispatchStatus(
  assessmentId: string
): Promise<AssessmentDispatchStatus> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/assessments/${encodeURIComponent(assessmentId)}/dispatch`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '발송 현황 조회에 실패했습니다.');
  }
  return data as AssessmentDispatchStatus;
}

export async function resendDispatchCredentials(
  assessmentId: string,
  portalIds: string[]
): Promise<{ sent: number; failed: number; skipped: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/assessments/${encodeURIComponent(assessmentId)}/dispatch/resend`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ portalIds }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '재발송에 실패했습니다.');
  }
  return data as { sent: number; failed: number; skipped: number };
}

export async function sendDispatchTestReminders(
  assessmentId: string,
  portalIds: string[]
): Promise<{ sent: number; failed: number; skipped: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/assessments/${encodeURIComponent(assessmentId)}/dispatch/remind`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ portalIds }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '미실시 알림 발송에 실패했습니다.');
  }
  return data as { sent: number; failed: number; skipped: number };
}

export async function resendBulkPortalNotifications(body: {
  jobId?: string;
  cohortId?: string;
}): Promise<{ resetFailed: number; requeued: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가 로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/client-portals/bulk/resend-notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '알림 재발송 요청에 실패했습니다.');
  }
  return data as { resetFailed: number; requeued: number };
}
