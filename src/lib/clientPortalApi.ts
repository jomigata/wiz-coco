/**
 * 내담자 포털 Flask API 클라이언트
 */

import type {
  ClientPortalBulkCreateResult,
  ClientPortalBulkJobResult,
  ClientPortalLoginResult,
  BulkPortalJobStatus,
  CounselorClientPortalListResult,
  CounselorClientPortalDetailResult,
  CounselorPortalTestAssignmentListResult,
  CounselorPushAssessmentResult,
  CounselorMonitoringHubResult,
  CounselorCohortMonitoringResult,
} from '@/types/clientPortal';
import type { PortalCareAssignmentsResult, SubmitPortalCareProgressInput, SubmitPortalCareProgressResult } from '@/types/careAssignment';
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

/** 포털 — 상담사가 할당한 치료·과제 (T-2-05) */
export async function fetchPortalCareAssignments(
  portalToken: string,
): Promise<PortalCareAssignmentsResult> {
  const res = await fetch(`${getBaseUrl()}/api/client-portals/care-assignments`, {
    headers: { Authorization: `Portal ${portalToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '과제 목록을 불러오지 못했습니다.');
  }
  return data as PortalCareAssignmentsResult;
}

/** 포털 — 진행 기록 제출 (T-2-06) */
export async function submitPortalCareProgress(
  portalToken: string,
  assignmentId: string,
  input: SubmitPortalCareProgressInput,
): Promise<SubmitPortalCareProgressResult> {
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/care-assignments/${encodeURIComponent(assignmentId)}/progress`,
    {
      method: 'POST',
      headers: {
        Authorization: `Portal ${portalToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '진행 기록 저장에 실패했습니다.');
  }
  return data as SubmitPortalCareProgressResult;
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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

export type ArchivedDispatchRecipient = {
  portalId: string;
  displayName: string;
  email: string;
  phone: string;
  myCode: string;
  joinAccessCode: string;
  assessmentId: string;
  assessmentTitle: string;
  cohortName: string;
  archivedAt: string | null;
};

export async function archiveDispatchRecipients(
  assessmentId: string,
  portalIds: string[],
): Promise<{ archived: number; failed: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/assessments/${encodeURIComponent(assessmentId)}/dispatch/archive`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ portalIds }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '삭제에 실패했습니다.');
  }
  return data as { archived: number; failed: number };
}

export async function fetchArchivedDispatchRecipients(
  assessmentId?: string,
): Promise<{ items: ArchivedDispatchRecipient[] }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
  const qs = assessmentId ? `?assessmentId=${encodeURIComponent(assessmentId)}` : '';
  const res = await fetch(`${getBaseUrl()}/api/client-portals/archived${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '목록 조회에 실패했습니다.');
  }
  return data as { items: ArchivedDispatchRecipient[] };
}

export async function restoreArchivedDispatchRecipients(
  portalIds: string[],
): Promise<{ restored: number; failed: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
  const res = await fetch(`${getBaseUrl()}/api/client-portals/archived/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ portalIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '복구에 실패했습니다.');
  }
  return data as { restored: number; failed: number };
}

export async function resendBulkPortalNotifications(body: {
  jobId?: string;
  cohortId?: string;
}): Promise<{ resetFailed: number; requeued: number }> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');
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

export async function listCounselorClientPortals(params?: {
  status?: 'active' | 'archived' | 'all';
  cohortId?: string;
  q?: string;
}): Promise<CounselorClientPortalListResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.cohortId) search.set('cohortId', params.cohortId);
  if (params?.q?.trim()) search.set('q', params.q.trim());
  const qs = search.toString() ? `?${search.toString()}` : '';

  const res = await fetch(`${getBaseUrl()}/api/client-portals${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '내담자 목록 조회에 실패했습니다.');
  }
  return data as CounselorClientPortalListResult;
}

export async function fetchCounselorClientPortalDetail(
  portalId: string,
): Promise<CounselorClientPortalDetailResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(
    `${getBaseUrl()}/api/client-portals/detail/${encodeURIComponent(portalId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '내담자 상세 조회에 실패했습니다.');
  }
  return data as CounselorClientPortalDetailResult;
}

export async function listCounselorPortalTestAssignments(params?: {
  status?: 'active' | 'archived' | 'all';
  testStatus?: 'all' | 'not_started' | 'in_progress' | 'completed';
  cohortId?: string;
  assessmentId?: string;
  q?: string;
}): Promise<CounselorPortalTestAssignmentListResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.testStatus) search.set('testStatus', params.testStatus);
  if (params?.cohortId) search.set('cohortId', params.cohortId);
  if (params?.assessmentId) search.set('assessmentId', params.assessmentId);
  if (params?.q?.trim()) search.set('q', params.q.trim());
  const qs = search.toString() ? `?${search.toString()}` : '';

  const res = await fetch(`${getBaseUrl()}/api/client-portals/assignments${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '검사 할당 목록 조회에 실패했습니다.');
  }
  return data as CounselorPortalTestAssignmentListResult;
}

export async function pushAssessmentsToPortals(body: {
  portalIds: string[];
  assessmentId?: string;
  title?: string;
  welcomeMessage?: string;
  usageEndDate?: string;
  testList?: { testId: string; name: string }[];
  notify?: boolean;
}): Promise<CounselorPushAssessmentResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/client-portals/push-assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '추가 검사 push에 실패했습니다.');
  }
  return data as CounselorPushAssessmentResult;
}

export async function fetchCounselorMonitoringHub(params?: {
  cohortId?: string;
}): Promise<CounselorMonitoringHubResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const search = new URLSearchParams();
  if (params?.cohortId) search.set('cohortId', params.cohortId);
  const qs = search.toString() ? `?${search.toString()}` : '';

  const res = await fetch(`${getBaseUrl()}/api/client-portals/monitoring${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '모니터링 허브 조회에 실패했습니다.');
  }
  return data as CounselorMonitoringHubResult;
}

export async function fetchCounselorCohortMonitoring(): Promise<CounselorCohortMonitoringResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('전문가·상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/client-portals/monitoring/cohorts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '그룹 모니터링 조회에 실패했습니다.');
  }
  return data as CounselorCohortMonitoringResult;
}
