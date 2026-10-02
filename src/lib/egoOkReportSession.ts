import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';

export const EGO_OK_REPORT_SESSION_KEY = 'wizcoco_ego_ok_report_draft';

export type EgoOkReportDraft = {
  v: 1;
  answers: Record<string, number>;
  clientInfo: ClientInfo | null;
  savedAt: number;
};

export function saveEgoOkReportDraft(draft: Omit<EgoOkReportDraft, 'v' | 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const payload: EgoOkReportDraft = {
    v: 1,
    answers: draft.answers,
    clientInfo: draft.clientInfo,
    savedAt: Date.now(),
  };
  sessionStorage.setItem(EGO_OK_REPORT_SESSION_KEY, JSON.stringify(payload));
}

export function loadEgoOkReportDraft(): EgoOkReportDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(EGO_OK_REPORT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EgoOkReportDraft;
    if (parsed.v !== 1 || !parsed.answers) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearEgoOkReportDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(EGO_OK_REPORT_SESSION_KEY);
}
