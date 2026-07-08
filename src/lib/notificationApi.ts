/**
 * Wave 6 — 알림·리마인더 API
 */

import { getCounselorToken } from '@/lib/counselorAuth';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export interface NotificationChannelStatus {
  email: { configured: boolean; provider: string };
  sms: { configured: boolean; providers: string[] };
  kakaoAlimtalk: {
    configured: boolean;
    provider: string | null;
    templates: { testReminder: boolean; careAssignment: boolean };
    pfId: boolean;
  };
  cron: Record<string, string>;
}

export interface ReminderBatchResult {
  sent: number;
  skipped: number;
  failed: number;
  minHoursBetween?: number;
  details?: {
    portalId?: string;
    assessmentId?: string;
    assignmentId?: string;
    status: string;
    sentVia?: string;
    errors?: string[];
    message?: string;
  }[];
}

export async function fetchNotificationChannelStatus(): Promise<NotificationChannelStatus> {
  const res = await fetch(`${getBaseUrl()}/api/notifications/status`);
  if (!res.ok) {
    throw new Error('알림 채널 상태 조회에 실패했습니다.');
  }
  return res.json();
}

export async function sendAssessmentReminders(body: {
  assessmentId: string;
  portalIds: string[];
}): Promise<ReminderBatchResult> {
  const token = await getCounselorToken();
  if (!token) throw new Error('상담사 로그인이 필요합니다.');

  const res = await fetch(`${getBaseUrl()}/api/notifications/reminders/assessment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : '리마인더 발송에 실패했습니다.');
  }
  return data as ReminderBatchResult;
}
