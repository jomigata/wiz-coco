import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import type { EgoOkGender } from '@/lib/egoOkScoring';
import { isLocalPsychTestServer } from '@/lib/localPsychTestDirectStart';

export const LOCAL_PSYCH_TEST_ARCHIVE_STORAGE_KEY = 'wizcoco_local_psych_test_archive_v1';
export const LOCAL_ARCHIVE_QUERY_KEY = 'localArchive';
export const LOCAL_ARCHIVE_FOCUS_QUERY_KEY = 'focus';

const MAX_ENTRIES = 40;

export type LocalPsychTestArchiveKind =
  | 'ego-ok-pro'
  | 'mbti-pro'
  | 'mbti'
  | 'inside-mbti'
  | 'integrated-assessment';

export type LocalPsychTestArchiveEntry =
  | {
      v: 1;
      id: string;
      kind: 'ego-ok-pro';
      title: string;
      savedAt: number;
      payload: {
        answers: Record<string, number>;
        clientInfo: ClientInfo | null;
        testGender?: EgoOkGender;
      };
    }
  | {
      v: 1;
      id: string;
      kind: 'mbti-pro';
      title: string;
      savedAt: number;
      payload: {
        answers: Record<string, number>;
        clientInfo: ClientInfo | null;
        mbtiType?: string;
      };
    }
  | {
      v: 1;
      id: string;
      kind: 'mbti';
      title: string;
      savedAt: number;
      payload: {
        answers: Record<string, { type: string; answer: number }>;
        summaryLine?: string;
      };
    }
  | {
      v: 1;
      id: string;
      kind: 'inside-mbti';
      title: string;
      savedAt: number;
      payload: {
        answers: Record<string, { type: string; answer: number }>;
        summaryLine?: string;
      };
    }
  | {
      v: 1;
      id: string;
      kind: 'integrated-assessment';
      title: string;
      savedAt: number;
      payload: {
        studentInfo: Record<string, string>;
        answers: Record<string, unknown>;
        report: Record<string, unknown>;
      };
    };

type MbtiMenuArchivePayload = Extract<
  LocalPsychTestArchiveEntry,
  { kind: 'mbti' }
>['payload'];

type SaveInput =
  | {
      kind: 'ego-ok-pro';
      title: string;
      payload: Extract<LocalPsychTestArchiveEntry, { kind: 'ego-ok-pro' }>['payload'];
    }
  | {
      kind: 'mbti-pro';
      title: string;
      payload: Extract<LocalPsychTestArchiveEntry, { kind: 'mbti-pro' }>['payload'];
    }
  | {
      kind: 'mbti';
      title: string;
      payload: MbtiMenuArchivePayload;
    }
  | {
      kind: 'inside-mbti';
      title: string;
      payload: MbtiMenuArchivePayload;
    }
  | {
      kind: 'integrated-assessment';
      title: string;
      payload: Extract<LocalPsychTestArchiveEntry, { kind: 'integrated-assessment' }>['payload'];
    };

function canUseArchiveStorage(): boolean {
  return typeof window !== 'undefined' && isLocalPsychTestServer();
}

function readAll(): LocalPsychTestArchiveEntry[] {
  if (!canUseArchiveStorage()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_PSYCH_TEST_ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalPsychTestArchiveEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e?.v === 1 && e.id && e.kind && e.payload);
  } catch {
    return [];
  }
}

function writeAll(entries: LocalPsychTestArchiveEntry[]): void {
  if (!canUseArchiveStorage()) return;
  localStorage.setItem(LOCAL_PSYCH_TEST_ARCHIVE_STORAGE_KEY, JSON.stringify(entries));
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listLocalPsychTestArchive(): LocalPsychTestArchiveEntry[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function getLocalPsychTestArchiveEntry(id: string): LocalPsychTestArchiveEntry | null {
  const key = (id || '').trim();
  if (!key) return null;
  return readAll().find((e) => e.id === key) ?? null;
}

export function saveLocalPsychTestArchive(
  input: Extract<SaveInput, { kind: 'ego-ok-pro' }>,
): string | null;
export function saveLocalPsychTestArchive(
  input: Extract<SaveInput, { kind: 'mbti-pro' }>,
): string | null;
export function saveLocalPsychTestArchive(
  input: Extract<SaveInput, { kind: 'mbti' }>,
): string | null;
export function saveLocalPsychTestArchive(
  input: Extract<SaveInput, { kind: 'inside-mbti' }>,
): string | null;
export function saveLocalPsychTestArchive(
  input: Extract<SaveInput, { kind: 'integrated-assessment' }>,
): string | null;
export function saveLocalPsychTestArchive(input: SaveInput): string | null {
  if (!canUseArchiveStorage()) return null;
  const id = newId();
  const savedAt = Date.now();
  const title = input.title.trim() || input.kind;
  let entry: LocalPsychTestArchiveEntry;
  switch (input.kind) {
    case 'ego-ok-pro':
      entry = { v: 1, id, kind: input.kind, title, savedAt, payload: input.payload };
      break;
    case 'mbti-pro':
      entry = { v: 1, id, kind: input.kind, title, savedAt, payload: input.payload };
      break;
    case 'mbti':
      entry = { v: 1, id, kind: 'mbti', title, savedAt, payload: input.payload };
      break;
    case 'inside-mbti':
      entry = { v: 1, id, kind: 'inside-mbti', title, savedAt, payload: input.payload };
      break;
    case 'integrated-assessment':
      entry = { v: 1, id, kind: input.kind, title, savedAt, payload: input.payload };
      break;
    default: {
      const _exhaustive: never = input;
      return _exhaustive;
    }
  }
  const next = [entry, ...readAll()].slice(0, MAX_ENTRIES);
  writeAll(next);
  return id;
}

export function removeLocalPsychTestArchive(id: string): void {
  if (!canUseArchiveStorage()) return;
  const key = (id || '').trim();
  writeAll(readAll().filter((e) => e.id !== key));
}

export function clearLocalPsychTestArchive(): void {
  if (!canUseArchiveStorage()) return;
  localStorage.removeItem(LOCAL_PSYCH_TEST_ARCHIVE_STORAGE_KEY);
}

export function localArchiveEgoOkResultHref(archiveId: string): string {
  return `/tests/ego-ok-pro/result?localDirect=1&${LOCAL_ARCHIVE_QUERY_KEY}=${encodeURIComponent(archiveId)}`;
}

export function localArchiveListHref(focusId?: string): string {
  const base = '/tests/local-archive?localDirect=1';
  if (!focusId) return base;
  return `${base}&${LOCAL_ARCHIVE_FOCUS_QUERY_KEY}=${encodeURIComponent(focusId)}`;
}

export function formatLocalArchiveWhen(savedAt: number): string {
  try {
    return new Date(savedAt).toLocaleString('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return String(savedAt);
  }
}
