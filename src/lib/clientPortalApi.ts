/**
 * 내담자 포털 Flask API 클라이언트
 */

import type {
  ClientPortalBulkCreateResult,
  ClientPortalLoginResult,
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
    throw new Error(
      typeof data?.message === 'string' && data.message.trim()
        ? data.message
        : '나의코드 또는 비밀번호를 확인해 주세요.'
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

export async function fetchPortalDashboard(portalToken: string): Promise<ClientPortalLoginResult['portal'] & {
  assessments: Array<{
    assessmentId: string;
    title: string;
    welcomeMessage: string;
    usageEndDate?: string;
    testList: { testId: string; name: string }[];
    accessCode: string;
  }>;
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

export async function linkSharedAssessment(
  portalToken: string,
  sharedAccessCode: string
): Promise<{ message: string; assessmentId?: string; assessments: unknown[] }> {
  const res = await fetch(`${getBaseUrl()}/api/client-portals/link-assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Portal ${portalToken}`,
    },
    body: JSON.stringify({ sharedAccessCode: normalizeAccessCodeInput(sharedAccessCode) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '공유 검사 연결에 실패했습니다.');
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
