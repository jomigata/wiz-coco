/** 상담진행 현황 — AI 추천 카드(검사·숙제) 숨김/복원·발송 결과 (브라우저 localStorage) */

export type RecommendCardSentSnapshot = {
  statusText: string;
  statusClassName: string;
  scheduledAt?: string;
};

const NEXT_DISMISS = 'counselorNextRecoDismissed:';
const NEXT_SENT = 'counselorNextRecoSent:';
const CARE_DISMISS = 'counselorQuickCareDismissed:';
const CARE_SENT = 'counselorQuickCareSent:';

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function nextTestDismissKey(portalId: string, assessmentId: string, testId: string): string {
  return `${NEXT_DISMISS}${portalId}:${assessmentId}:${testId}`;
}

export function quickCareDismissKey(portalId: string, presetId: string): string {
  return `${CARE_DISMISS}${portalId}:${presetId}`;
}

export function isNextTestRecommendationHidden(
  portalId: string,
  assessmentId: string,
  testId: string,
): boolean {
  return safeGet(nextTestDismissKey(portalId, assessmentId, testId)) === '1';
}

export function hideNextTestRecommendation(portalId: string, assessmentId: string, testId: string): void {
  safeSet(nextTestDismissKey(portalId, assessmentId, testId), '1');
}

export function restoreNextTestRecommendation(portalId: string, assessmentId: string, testId: string): void {
  safeRemove(nextTestDismissKey(portalId, assessmentId, testId));
}

export function readNextTestRecommendationSent(
  portalId: string,
  assessmentId: string,
  testId: string,
): RecommendCardSentSnapshot | null {
  const raw = safeGet(`${NEXT_SENT}${portalId}:${assessmentId}:${testId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecommendCardSentSnapshot;
  } catch {
    return null;
  }
}

export function writeNextTestRecommendationSent(
  portalId: string,
  assessmentId: string,
  testId: string,
  snapshot: RecommendCardSentSnapshot,
): void {
  safeSet(`${NEXT_SENT}${portalId}:${assessmentId}:${testId}`, JSON.stringify(snapshot));
}

export function clearNextTestRecommendationSent(
  portalId: string,
  assessmentId: string,
  testId: string,
): void {
  safeRemove(`${NEXT_SENT}${portalId}:${assessmentId}:${testId}`);
}

export function isQuickCareRecommendationHidden(portalId: string, presetId: string): boolean {
  return safeGet(quickCareDismissKey(portalId, presetId)) === '1';
}

export function hideQuickCareRecommendation(portalId: string, presetId: string): void {
  safeSet(quickCareDismissKey(portalId, presetId), '1');
}

export function restoreQuickCareRecommendation(portalId: string, presetId: string): void {
  safeRemove(quickCareDismissKey(portalId, presetId));
}

export function readQuickCareRecommendationSent(
  portalId: string,
  presetId: string,
): RecommendCardSentSnapshot | null {
  const raw = safeGet(`${CARE_SENT}${portalId}:${presetId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecommendCardSentSnapshot;
  } catch {
    return null;
  }
}

export function writeQuickCareRecommendationSent(
  portalId: string,
  presetId: string,
  snapshot: RecommendCardSentSnapshot,
): void {
  safeSet(`${CARE_SENT}${portalId}:${presetId}`, JSON.stringify(snapshot));
}

export function clearQuickCareRecommendationSent(portalId: string, presetId: string): void {
  safeRemove(`${CARE_SENT}${portalId}:${presetId}`);
}

export function formatRecommendNotifyStatusText(opts: {
  scheduledAt?: string;
  notifySent?: number;
  notifyFailed?: number;
  appOnly?: boolean;
}): RecommendCardSentSnapshot {
  if (opts.scheduledAt) {
    const when = formatScheduleLabel(opts.scheduledAt);
    return {
      statusText: `예약 · ${when}`,
      statusClassName: 'text-amber-300',
      scheduledAt: opts.scheduledAt,
    };
  }
  const sent = opts.notifySent ?? 0;
  const failed = opts.notifyFailed ?? 0;
  if (sent > 0 && failed === 0) {
    return {
      statusText: opts.appOnly ? '내 검사실 앱 알림 성공' : '발송 성공',
      statusClassName: 'text-emerald-400',
    };
  }
  if (sent > 0 && failed > 0) {
    return {
      statusText: `발송 성공 ${sent} · 실패 ${failed}`,
      statusClassName: 'text-amber-300',
    };
  }
  if (failed > 0) {
    return { statusText: '발송 실패', statusClassName: 'text-red-400' };
  }
  return { statusText: '발송 생략', statusClassName: 'text-slate-400' };
}

export function formatScheduleLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function parseScheduleInputToIso(localValue: string): string | null {
  const v = (localValue || '').trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() <= Date.now()) return null;
  return d.toISOString();
}

export function defaultScheduleInputValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
